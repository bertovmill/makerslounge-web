import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { ClaudeSearchResponse, Profile, SearchRequest } from "@/types/search";

// Available skills in the system
const AVAILABLE_SKILLS = [
  "AI",
  "Web Dev",
  "Design",
  "Marketing",
  "Sales",
  "Product",
  "Mobile Dev",
  "Data Science",
  "E-commerce",
  "Community",
];

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: SearchRequest = await request.json();

    // Validation
    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        { error: "Invalid query parameter" },
        { status: 400 }
      );
    }

    if (body.query.length > 500) {
      return NextResponse.json(
        { error: "Query too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedQuery = body.query.trim().replace(/[<>]/g, "");

    // If query is empty, return all profiles
    if (!sanitizedQuery) {
      return await getAllProfiles(startTime);
    }

    // API key check
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "AI search not configured" },
        { status: 500 }
      );
    }

    // Initialize Supabase client
    const supabase: any = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Claude prompt for query interpretation
    const prompt = `You are a search intent analyzer for MakersLounge, a community platform for builders and makers.

Analyze the user's search query and determine the best search strategy.

## Available Data:
- profiles table: id, name, bio, skills (array), photo_url, linkedin, twitter, website, username
- projects table: title, description, media_urls (linked to profiles)

## Available Skills:
${AVAILABLE_SKILLS.join(", ")}

## Search Strategies:
1. KEYWORD: Simple text matching in name/bio (e.g., "john", "founder")
2. SKILL_MATCH: Filter by specific skills (e.g., "React developer", "designer")
3. SEMANTIC: Intent-based matching requiring understanding (e.g., "someone building AI apps", "need help with marketing")
4. SIMILARITY: Find people similar to a reference profile (e.g., "people like me", "similar to...")

## User Query:
"${sanitizedQuery}"

## Your Task:
Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "strategy": "keyword" | "skill_match" | "semantic" | "similarity",
  "interpretation": "Brief explanation of what you understood",
  "filters": {
    "skills": ["skill1", "skill2"],
    "bioKeywords": ["keyword1", "keyword2"],
    "projectKeywords": ["term1"],
    "nameQuery": "exact name if mentioned"
  }
}`;

    // Call Claude API
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text response
    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse Claude's response
    const claudeResponse: ClaudeSearchResponse = JSON.parse(textContent.text);

    // Execute search based on Claude's interpretation
    const results = await executeSearch(
      supabase,
      claudeResponse,
      body.currentUserId,
      body.filters?.skills
    );

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      results: results.data || [],
      metadata: {
        interpretation: claudeResponse.interpretation,
        searchStrategy: claudeResponse.strategy,
        totalMatches: results.data?.length || 0,
        processingTimeMs,
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Search failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

async function getAllProfiles(startTime: number) {
  const supabase: any = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, photo_url, bio, skills")
    .not("name", "is", null)
    .order("name", { ascending: true })
    .limit(50);

  if (error) throw error;

  return NextResponse.json({
    results: data || [],
    metadata: {
      interpretation: "Showing all makers",
      searchStrategy: "keyword" as const,
      totalMatches: data?.length || 0,
      processingTimeMs: Date.now() - startTime,
    },
  });
}

async function executeSearch(
  supabase: any,
  claudeResponse: ClaudeSearchResponse,
  currentUserId?: string,
  preSelectedSkills?: string[]
) {
  let query = supabase
    .from("profiles")
    .select("id, name, photo_url, bio, skills")
    .not("name", "is", null);

  switch (claudeResponse.strategy) {
    case "keyword": {
      // Simple text search in name/bio
      const conditions: string[] = [];

      if (claudeResponse.filters.nameQuery) {
        conditions.push(`name.ilike.%${claudeResponse.filters.nameQuery}%`);
      }

      if (claudeResponse.filters.bioKeywords?.length) {
        claudeResponse.filters.bioKeywords.forEach((kw) => {
          conditions.push(`bio.ilike.%${kw}%`);
        });
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(","));
      }
      break;
    }

    case "skill_match": {
      // Filter by exact skill matches
      const skills = claudeResponse.filters.skills || preSelectedSkills || [];
      if (skills.length > 0) {
        query = query.overlaps("skills", skills);
      }
      break;
    }

    case "semantic": {
      // Broader search with skill and keyword filters
      const skills = claudeResponse.filters.skills || preSelectedSkills || [];
      const bioConditions: string[] = [];

      if (skills.length > 0) {
        query = query.overlaps("skills", skills);
      }

      if (claudeResponse.filters.bioKeywords?.length) {
        claudeResponse.filters.bioKeywords.forEach((kw) => {
          bioConditions.push(`bio.ilike.%${kw}%`);
        });
      }

      if (bioConditions.length > 0) {
        query = query.or(bioConditions.join(","));
      }

      query = query.limit(100); // Fetch broader set for semantic matching
      break;
    }

    case "similarity": {
      // Find people with similar skills to reference user
      if (currentUserId) {
        const { data: referenceUser } = await supabase
          .from("profiles")
          .select("skills, bio")
          .eq("id", currentUserId)
          .single();

        if (referenceUser?.skills?.length) {
          query = query
            .overlaps("skills", referenceUser.skills)
            .not("id", "eq", currentUserId); // Exclude self
        }
      }
      break;
    }
  }

  // Execute query
  const { data, error } = await query
    .order("name", { ascending: true })
    .limit(50);

  if (error) throw error;

  return { data };
}
