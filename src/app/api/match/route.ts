import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface Contact {
  id: string;
  name: string;
  email: string;
  custom_fields: Record<string, string> | null;
}

interface PairResult {
  person1_id: string;
  person2_id: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const { contacts, instruction } = await request.json();

    if (!contacts || contacts.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 contacts" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // Format contacts for the prompt
    const contactList = contacts
      .map((c: Contact) => {
        const fields = c.custom_fields
          ? Object.entries(c.custom_fields)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "";
        return `- ID: ${c.id}, Name: ${c.name}, Email: ${c.email}${fields ? `, ${fields}` : ""}`;
      })
      .join("\n");

    const prompt = `You are a matchmaker. Given a list of people and an instruction, create pairs.

## People:
${contactList}

## Instruction:
${instruction || "Pair people with similar interests or attributes"}

## Task:
Create pairs from these people. Each person can only be in one pair. If there's an odd number, one person will be left unpaired.

Respond with ONLY a JSON array of pairs in this exact format (no markdown, no explanation):
[{"person1_id": "id1", "person2_id": "id2", "reason": "Brief explanation of why they're paired"}]`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract the text response
    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse the JSON response
    const pairs: PairResult[] = JSON.parse(textContent.text);

    return NextResponse.json({ pairs });
  } catch (error) {
    console.error("Match API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate matches" },
      { status: 500 }
    );
  }
}
