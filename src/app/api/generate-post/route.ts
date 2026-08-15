import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

interface WebSource {
  title: string;
  url: string;
}

// Collapse the SDK's url sources into unique {title, url} pairs.
// `Source` isn't exported from "ai", so infer it off generateText's result.
type ResultSources = Awaited<ReturnType<typeof generateText>>["sources"];

function dedupeSources(sources: ResultSources): WebSource[] {
  const seenUrls = new Set<string>();
  const out: WebSource[] = [];

  for (const source of sources) {
    if (source.sourceType !== "url" || seenUrls.has(source.url)) continue;
    seenUrls.add(source.url);
    out.push({ title: source.title || "Source", url: source.url });
  }

  return out;
}

export async function POST(request: Request) {
  try {
    const { title, notes, channel, tone, channelName, mediaType, useWebSearch, searchQuery } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Define channel-specific guidelines
    const channelGuidelines: Record<string, string> = {
      x: `Twitter/X Post Guidelines:
- Maximum 280 characters
- Use line breaks for readability
- Can include 1-2 relevant hashtags at the end (not required)
- Conversational and punchy
- Can use emojis sparingly
- Hook in the first line`,

      linkedin: `LinkedIn Post Guidelines:
- 1300 characters ideal, max 3000
- Professional but personable tone
- Use line breaks and spacing for readability
- Start with a strong hook
- End with a question or call-to-action
- Can include 3-5 relevant hashtags at the end
- Tell a story or share an insight`,

      instagram: `Instagram Caption Guidelines:
- Up to 2200 characters, but first 125 shown in preview
- Strong hook in first line (before "...more")
- Use emojis to add personality
- Include a call-to-action
- Add 5-10 relevant hashtags at the end
- Conversational and authentic`,

      youtube: `YouTube Description/Community Post Guidelines:
- Hook in the first sentence
- Describe what the video/content is about
- Include key takeaways or timestamps if relevant
- Call-to-action (subscribe, comment, etc.)
- Can be longer and more detailed`,

      tiktok: `TikTok Caption Guidelines:
- Short and punchy (150 characters ideal)
- Hook immediately
- Trending hashtags if relevant
- Use emojis
- Conversational Gen-Z friendly tone`,

      threads: `Threads Post Guidelines:
- Up to 500 characters
- Conversational and casual
- Similar to Twitter but can be slightly longer
- Can tell a mini-story
- Authentic and personal`,

      newsletter: `Newsletter/Blog Intro Guidelines:
- 2-3 paragraphs
- Hook readers immediately
- Set up the problem or topic
- Tease the value they'll get
- Professional but engaging`,

      default: `General Social Media Post Guidelines:
- Clear and engaging
- Hook in the first line
- Value-driven content
- Call-to-action if appropriate
- Adapt format to suit the platform`,
    };

    // For custom channels, create dynamic guidelines
    const getChannelGuidelines = (channelId: string, customName?: string): string => {
      if (channelGuidelines[channelId]) {
        return channelGuidelines[channelId];
      }

      // Custom channel - provide flexible guidelines
      const platformName = customName || channelId;
      return `${platformName} Post Guidelines:
- Adapt the content style to fit ${platformName}
- Clear and engaging writing
- Hook in the first line to capture attention
- Value-driven content that serves your audience
- Include a call-to-action if appropriate
- Keep the authentic voice of the original idea`;
    };

    const toneGuidelines: Record<string, string> = {
      professional: "Write in a professional, authoritative tone. Be clear and direct.",
      casual: "Write in a casual, friendly tone. Be conversational and approachable.",
      educational: "Write in an educational, helpful tone. Focus on teaching and explaining.",
      inspiring: "Write in an inspiring, motivational tone. Be uplifting and encouraging.",
      humorous: "Write in a light, witty tone. Add humor where appropriate but keep it natural.",
    };

    const selectedChannel = channel || "default";
    const selectedTone = tone || "casual";
    const selectedMediaType = mediaType || "none";
    const guidelines = getChannelGuidelines(selectedChannel, channelName);
    const toneGuide = toneGuidelines[selectedTone] || toneGuidelines.casual;

    // Media type guidance
    const mediaGuidelines: Record<string, string> = {
      none: "",
      image: "\n- This post will include an image, so write copy that complements visual content\n- Consider referencing what might be shown in the image\n- The text should work together with the visual, not repeat it",
      video: "\n- This post will include a video, so write copy that hooks viewers to watch\n- Tease the content of the video without giving everything away\n- Include a reason to watch or key takeaway",
      carousel: "\n- This post will include multiple images/slides (carousel)\n- Write copy that encourages swiping through\n- Consider teasing the value across the slides",
    };
    const mediaGuide = mediaGuidelines[selectedMediaType] || "";

    // Build system prompt - adjust based on whether web search is enabled
    const webSearchInstructions = useWebSearch
      ? `\n- IMPORTANT: Use the web_search tool to find current, relevant information about the topic before writing the post
- Search for recent news, trends, statistics, or developments related to the topic
- Use the search results to make the post more current, relevant, and informed
- Don't explicitly cite sources in the post unless it's natural to do so`
      : "";

    const systemPrompt = `You are an expert content creator and social media strategist. Your job is to transform rough ideas and notes into polished, ready-to-post content.

${guidelines}

Tone: ${toneGuide}

Important:
- Transform the user's rough idea into a polished, engaging post
- Keep the original intent and message
- Make it sound natural, not AI-generated
- If the notes contain specific details, incorporate them naturally${webSearchInstructions}${mediaGuide}

Output only the final post content - no explanations, no "here's your post", just the content itself.`;

    const mediaTypeLabel = selectedMediaType !== "none" ? ` (with ${selectedMediaType})` : "";
    const searchHint = useWebSearch && searchQuery ? `\n\nSearch topic hint: ${searchQuery}` : "";
    const userPrompt = `Transform this idea into a ready-to-post ${selectedChannel === "default" ? "social media post" : selectedChannel + " post"}${mediaTypeLabel}:

Title/Topic: ${title}
${notes ? `\nNotes/Context: ${notes}` : ""}${searchHint}`;

    // Anthropic runs web search server-side; the gateway passes the tool through.
    const webSearchTool = { web_search: anthropic.tools.webSearch_20250305({ maxUses: 3 }) };

    const result = await generateText({
      model: "anthropic/claude-sonnet-4",
      maxOutputTokens: 1000,
      system: systemPrompt,
      prompt: userPrompt,
      tools: useWebSearch ? webSearchTool : undefined,
    });

    const sources = dedupeSources(result.sources);

    return NextResponse.json({
      content: result.text.trim(),
      channel: selectedChannel,
      tone: selectedTone,
      mediaType: selectedMediaType,
      webSearchUsed: sources.length > 0,
      sources: sources.length > 0 ? sources : undefined,
      // Debug info for viewing the API call
      debug: {
        request: {
          model: "anthropic/claude-sonnet-4",
          maxOutputTokens: 1000,
          system: systemPrompt,
          prompt: userPrompt,
          tools: useWebSearch ? ["web_search"] : undefined,
        },
        response: {
          usage: result.usage,
          finishReason: result.finishReason,
          content: result.content,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Generate post API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate post";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
