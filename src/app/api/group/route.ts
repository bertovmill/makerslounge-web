import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface Contact {
  name: string;
  email: string;
  project?: string;
  phase?: string;
  skills?: string;
  needsHelp?: string;
}

interface GroupResult {
  members: string[];
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const { contacts, groupSize = 4 } = await request.json();

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
      .map((c: Contact, i: number) => {
        const parts = [`${i + 1}. ${c.name || "Unknown"} (${c.email || "no email"})`];
        if (c.project) parts.push(`   Project: ${c.project}`);
        if (c.phase) parts.push(`   Phase: ${c.phase}`);
        if (c.skills) parts.push(`   Skills: ${c.skills}`);
        if (c.needsHelp) parts.push(`   Needs help with: ${c.needsHelp}`);
        return parts.join("\n");
      })
      .join("\n\n");

    const prompt = `You are organizing a MakersLounge networking event. Your goal is to create small groups of ${groupSize} people that will have great conversations and help each other.

## Attendees:
${contactList}

## Grouping Strategy:
- Create groups of approximately ${groupSize} people each
- Match people who HAVE skills with people who NEED those skills
- Mix different project phases (Spark/Build/Momentum) for diverse perspectives
- Consider complementary projects and interests
- Everyone should be in exactly one group

## Output Format:
Return ONLY a JSON array with no markdown or explanation. Each group should have:
- "members": array of names exactly as they appear above
- "reason": 1-2 sentence explanation of why this group works well together

Example format:
[{"members": ["Alice", "Bob", "Carol"], "reason": "Alice's marketing skills match Bob's needs, and Carol's startup experience complements both."}]`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse the JSON response
    let groups: GroupResult[];
    try {
      groups = JSON.parse(textContent.text);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        groups = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse groups from response");
      }
    }

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Group API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate groups" },
      { status: 500 }
    );
  }
}
