import { NextResponse } from "next/server";
import { generateText, type ModelMessage } from "ai";

interface EventData {
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  event_url: string | null;
  is_all_day: boolean;
}

export async function POST(request: Request) {
  try {
    const { prompt, event, conversationHistory } = await request.json();

    const eventDetails = event as EventData;
    const startDate = new Date(eventDetails.start_time);
    const endDate = new Date(eventDetails.end_time);

    const formattedDate = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = eventDetails.is_all_day
      ? "All day"
      : `${startDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })} - ${endDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}`;

    // Build conversation history for Claude
    const messages: ModelMessage[] =
      conversationHistory
        ? conversationHistory.map(
            (msg: { role: string; content: string }) => ({
              role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
              content: msg.content,
            })
          )
        : [];

    messages.push({
      role: "user",
      content: prompt,
    });

    const systemPrompt = `You are an expert event planner and marketing assistant for MakersLounge, a community for makers, builders, and entrepreneurs in Toronto.

You are helping plan the following event:
- **Event Name:** ${eventDetails.title}
- **Date:** ${formattedDate}
- **Time:** ${formattedTime}
${eventDetails.location ? `- **Location:** ${eventDetails.location}` : ""}
${eventDetails.description ? `- **Description:** ${eventDetails.description}` : ""}
${eventDetails.event_url ? `- **Event Page:** ${eventDetails.event_url}` : ""}

Your role is to help with:
1. **Social Media Content:** Create engaging posts for Twitter/X, LinkedIn, and Instagram. Include relevant hashtags and emojis. Make posts feel authentic and community-focused.
2. **Event Descriptions:** Write compelling descriptions that highlight the value for attendees.
3. **Planning Checklists:** Create actionable task lists with realistic timelines.
4. **Email Communications:** Draft professional yet warm emails for invitations, reminders, and follow-ups.
5. **Speaker/Guest Outreach:** Help craft outreach messages to potential speakers or special guests.
6. **Logistics Planning:** Suggest venue considerations, catering ideas, and day-of schedules.

Guidelines:
- Keep the MakersLounge brand voice: friendly, professional, maker-focused
- Use Toronto/Canadian context when relevant
- Be specific and actionable in your suggestions
- Format output clearly with headers and bullet points when helpful
- For social media, provide platform-specific variations
- Consider the maker/builder/entrepreneur audience
- Keep responses focused and practical

When generating social posts, include:
- A Twitter/X version (under 280 characters)
- A LinkedIn version (professional, can be longer)
- An Instagram caption (engaging, with hashtag suggestions)`;

    const { text } = await generateText({
      model: "anthropic/claude-3.7-sonnet",
      maxOutputTokens: 2048,
      system: systemPrompt,
      messages,
    });

    return NextResponse.json({ response: text });
  } catch (error: unknown) {
    console.error("Event planner API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
