import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface Contact {
  [key: string]: string;
}

interface Recommendation {
  name: string;
  reason: string;
  matchStrength: number; // 1-3
}

export async function POST(request: NextRequest) {
  try {
    const { query, contacts } = await request.json();

    if (!query || !contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: "Missing query or contacts" },
        { status: 400 }
      );
    }

    // Build a summary of each contact for the AI
    const contactSummaries = contacts.map((contact: Contact) => {
      const name = contact.name || "Unknown";
      const project = contact["What project(s) are you working on?"] || contact.project || "";
      const skills = contact["What are your superpower (skills you have)🦸?"] || contact.skills || "";
      const needsHelp = contact["What do you need help with right now?🚁"] || contact.needsHelp || "";
      const phase = contact["What phase are you in? "] || contact.phase || "";
      const linkedin = contact["LinkedIn"] || "";

      return `- ${name}: Project: "${project}" | Skills: "${skills}" | Needs help with: "${needsHelp}" | Phase: "${phase}"`;
    }).join("\n");

    const systemPrompt = `You are a networking matchmaker assistant for a maker/builder community event.
Your job is to recommend the best people to talk to based on the user's specific needs or interests.

Be specific and actionable in your recommendations. Focus on genuine synergies.`;

    const userPrompt = `Here are the attendees at this event:

${contactSummaries}

The user is looking for: "${query}"

Based on this, recommend 3-5 people who would be most valuable for them to connect with.

Respond in this exact JSON format:
{
  "answer": "A brief 1-2 sentence summary answering their question",
  "recommendations": [
    {
      "name": "Exact name from the list",
      "reason": "Specific reason why they should connect (2-3 sentences)",
      "matchStrength": 3
    }
  ]
}

matchStrength should be:
- 3 = Perfect match, highly relevant
- 2 = Good match, relevant connection
- 1 = Potential match, worth exploring

Only include people from the attendee list. Be specific about WHY each person is a good match.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    // Extract text content
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse the JSON response
    const responseText = textContent.text;

    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      answer: result.answer,
      recommendations: result.recommendations as Recommendation[],
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
