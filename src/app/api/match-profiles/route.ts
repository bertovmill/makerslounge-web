import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface ProfileSummary {
  id: string;
  name: string | null;
  bio: string | null;
  skills: string[] | null;
  looking_for: string | null;
}

interface MatchRecommendation {
  id: string;
  name: string;
  matchReason: string;
  matchStrength: number; // 1-3
}

export async function POST(request: NextRequest) {
  try {
    const { query, profiles } = await request.json();

    if (!query || !profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: "Missing query or profiles" },
        { status: 400 }
      );
    }

    // Build a summary of each profile for the AI
    const profileSummaries = profiles
      .map((profile: ProfileSummary) => {
        const name = profile.name || "Anonymous";
        const skills = profile.skills?.join(", ") || "Not specified";
        const bio = profile.bio || "No bio";
        const lookingFor = profile.looking_for || "Not specified";

        return `- [ID: ${profile.id}] ${name}: Skills: "${skills}" | Bio: "${bio}" | Looking for: "${lookingFor}"`;
      })
      .join("\n");

    const systemPrompt = `You are an AI matchmaker for MakersLounge, a community of builders and makers.
Your job is to analyze member profiles and find the best matches based on what someone is looking for.
Focus on genuine synergies: complementary skills, shared interests, and mutual benefit.`;

    const userPrompt = `Here are the members on the platform:

${profileSummaries}

The user is looking for: "${query}"

Based on this, recommend 3-5 people who would be the best matches.

Respond in this exact JSON format:
{
  "answer": "A brief 1-2 sentence summary of who you found",
  "recommendations": [
    {
      "id": "The exact ID from the list",
      "name": "Exact name from the list",
      "matchReason": "Specific reason why they're a good match (2-3 sentences)",
      "matchStrength": 3
    }
  ]
}

matchStrength should be:
- 3 = Perfect match, highly relevant
- 2 = Good match, relevant connection
- 1 = Potential match, worth exploring

Only include people from the member list. Be specific about WHY each person is a good match.`;

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
      recommendations: result.recommendations as MatchRecommendation[],
    });
  } catch (error) {
    console.error("Match profiles error:", error);
    return NextResponse.json(
      { error: "Failed to find matches" },
      { status: 500 }
    );
  }
}
