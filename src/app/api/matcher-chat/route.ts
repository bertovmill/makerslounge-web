import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all community profiles
    const { data: profiles, error: dbError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, name, username, bio, skills, looking_for_skills, currently_building"
      )
      .not("name", "is", null);

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to load community profiles" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build profile summaries for context
    const profileSummaries = (profiles || [])
      .filter((p) => p.name?.trim())
      .map((p) => {
        const parts = [`- ${p.name}`];
        if (p.username) parts.push(`(@${p.username})`);
        if (p.bio) parts.push(`| Bio: "${p.bio}"`);
        if (p.skills?.length) parts.push(`| Skills: ${p.skills.join(", ")}`);
        if (p.looking_for_skills?.length)
          parts.push(
            `| Looking for: ${p.looking_for_skills.join(", ")}`
          );
        if (p.currently_building) {
          try {
            const projects = JSON.parse(p.currently_building);
            if (Array.isArray(projects) && projects.length)
              parts.push(`| Building: ${projects.join(", ")}`);
          } catch {
            if (p.currently_building.trim())
              parts.push(`| Building: ${p.currently_building}`);
          }
        }
        return parts.join(" ");
      })
      .join("\n");

    const systemPrompt = `You are the MakersLounge AI Matcher - a friendly, helpful assistant that connects people in the MakersLounge maker/builder community.

You have access to the community member profiles below. Your job is to help users find the right people to connect with based on what they're looking for.

COMMUNITY MEMBERS (${profiles?.length || 0} people):
${profileSummaries}

GUIDELINES:
- Be conversational and warm, but concise
- When recommending people, explain WHY they're a good match with specific details from their profile
- If the user's request is vague, ask a clarifying question
- You can suggest 2-5 people per recommendation
- Format names in bold and include their username as a link when available: **Name** (@username)
- If no one matches well, be honest about it and suggest broadening the search
- You can help with: finding collaborators, skill matching, project partnerships, mentorship, etc.
- Keep responses focused - don't list every detail about a person, just what's relevant to the user's need`;

    // Stream the response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Return as SSE stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Matcher chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
