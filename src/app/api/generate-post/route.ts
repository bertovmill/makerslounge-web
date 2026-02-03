import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function performWebSearch(query: string): Promise<WebSearchResult[]> {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      console.log("Tavily API key not configured, skipping web search");
      return [];
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      console.error("Tavily search failed");
      return [];
    }

    const data = await response.json();
    return data.results.map((r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.content.slice(0, 300),
    }));
  } catch (error) {
    console.error("Web search error:", error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { title, notes, channel, tone, channelName, useWebSearch, searchQuery } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Perform web search if enabled
    let webSearchResults: WebSearchResult[] = [];
    let webSearchContext = "";

    if (useWebSearch) {
      const query = searchQuery || title;
      webSearchResults = await performWebSearch(query);

      if (webSearchResults.length > 0) {
        webSearchContext = `\n\n## Recent Web Research
Here are some current, relevant findings from the web to inform your post:

${webSearchResults.map((r, i) => `${i + 1}. **${r.title}**
   ${r.snippet}
   Source: ${r.url}`).join("\n\n")}

Use these insights to make the post more current, relevant, and informed. You can reference trends, statistics, or recent developments mentioned above. Don't explicitly cite sources in the post unless it's natural to do so.`;
      }
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
    const guidelines = getChannelGuidelines(selectedChannel, channelName);
    const toneGuide = toneGuidelines[selectedTone] || toneGuidelines.casual;

    const systemPrompt = `You are an expert content creator and social media strategist. Your job is to transform rough ideas and notes into polished, ready-to-post content.

${guidelines}

Tone: ${toneGuide}

Important:
- Transform the user's rough idea into a polished, engaging post
- Keep the original intent and message
- Make it sound natural, not AI-generated
- Don't add information that wasn't implied in the original idea${useWebSearch ? " (unless informed by the web research provided)" : ""}
- If the notes contain specific details, incorporate them naturally${useWebSearch ? "\n- If web research is provided, use it to make the post more current, relevant, and informed" : ""}

Output only the final post content - no explanations, no "here's your post", just the content itself.`;

    const userPrompt = `Transform this idea into a ready-to-post ${selectedChannel === "default" ? "social media post" : selectedChannel + " post"}:

Title/Topic: ${title}
${notes ? `\nNotes/Context: ${notes}` : ""}${webSearchContext}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const generatedContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({
      content: generatedContent.trim(),
      channel: selectedChannel,
      tone: selectedTone,
      webSearchUsed: useWebSearch && webSearchResults.length > 0,
      sources: webSearchResults.length > 0 ? webSearchResults.map(r => ({ title: r.title, url: r.url })) : undefined,
      // Debug info for viewing the API call
      debug: {
        request: {
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        },
        response: {
          id: response.id,
          model: response.model,
          usage: response.usage,
          content: response.content,
          stop_reason: response.stop_reason,
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
