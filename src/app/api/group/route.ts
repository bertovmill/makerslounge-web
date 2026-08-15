import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";

interface Contact {
  name: string;
  email: string;
  project?: string;
  phase?: string;
  skills?: string;
  needsHelp?: string;
}

interface Connection {
  from: string;
  to: string;
  reason: string;
  strength: number;
}

interface GroupResult {
  members: string[];
  reason: string;
  connections?: Connection[];
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
- "connections": array of pairwise connections between members. For each meaningful connection, include:
  - "from": name of first person
  - "to": name of second person
  - "reason": A detailed 2-3 sentence explanation of why these two people should connect. Be specific about what each person brings to the table and how they can help each other. Mention their specific skills, projects, or needs.
  - "strength": 1 (mild), 2 (medium), or 3 (strong) connection

Include 2-4 connections per group, focusing on the strongest relationships.

Example format:
[{
  "members": ["Alice", "Bob", "Carol"],
  "reason": "Alice's marketing skills match Bob's needs, and Carol's startup experience complements both.",
  "connections": [
    {"from": "Alice", "to": "Bob", "reason": "Alice has 5 years of B2B marketing experience and is looking to help early-stage founders. Bob is building a SaaS product and specifically mentioned needing help with go-to-market strategy. Alice could mentor Bob on positioning and launch tactics.", "strength": 3},
    {"from": "Bob", "to": "Carol", "reason": "Both are in the early build phase of their startups, facing similar challenges around product-market fit. Carol's experience with user research could help Bob validate his assumptions, while Bob's technical background could help Carol with her app development.", "strength": 2}
  ]
}]`;

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4",
      maxOutputTokens: 4096,
      prompt,
    });

    if (!text) {
      throw new Error("No text response from Claude");
    }

    // Parse the JSON response
    let groups: GroupResult[];
    try {
      groups = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
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
