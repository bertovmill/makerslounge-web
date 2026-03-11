import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `You are the MakersLounge AI Matcher — a friendly assistant that helps people find the right connections in the MakersLounge maker/builder community.

You have tools to search and filter the community. Use them to find relevant people based on what the user is looking for.

WORKFLOW:
1. When the user describes what they need, use the appropriate tool(s) to search
2. You can combine tools — e.g. search by keyword AND filter by skills
3. Present results with a brief explanation of WHY each person is a good match
4. If no results, suggest broadening the search or trying different terms

GUIDELINES:
- Be conversational and warm, but concise
- Always use tools to find people — don't make up profiles
- When recommending people, explain WHY they match based on their actual profile data
- If the request is vague, ask a clarifying question before searching
- Format names as bold links to their profile: [**Name**](/p/username) — always use the profile_url from the tool results
- Suggest 2-5 people per recommendation
- If the user asks to filter or search differently, use the tools again`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      search_people: {
        description:
          "Search community members by keyword. Matches against name, bio, and what they're currently building. Use this for general queries like finding someone by name or topic.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("Search keyword (name, topic, or interest)"),
        }),
        execute: async ({ query }: { query: string }) => {
          const searchTerm = `%${query}%`;
          const { data, error } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building"
            )
            .not("name", "is", null)
            .or(
              `name.ilike.${searchTerm},bio.ilike.${searchTerm},currently_building.ilike.${searchTerm}`
            )
            .limit(10);

          if (error) return { error: "Search failed" };
          if (!data || data.length === 0)
            return { results: [], message: "No people found matching that query" };

          return {
            results: data.map(formatProfile),
            count: data.length,
          };
        },
      },

      filter_by_skills: {
        description:
          "Filter community members who have specific skills. Use this when the user is looking for people with particular expertise like 'design', 'AI', 'marketing', etc.",
        inputSchema: z.object({
          skills: z
            .array(z.string())
            .describe(
              "Skills to filter by (e.g. ['AI', 'Web Dev', 'Design'])"
            ),
          match_all: z
            .boolean()
            .optional()
            .describe(
              "If true, person must have ALL listed skills. Default false (any match)."
            ),
        }),
        execute: async ({ skills, match_all }: { skills: string[]; match_all?: boolean }) => {
          const { data, error } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building"
            )
            .not("name", "is", null)
            .overlaps("skills", skills);

          if (error) return { error: "Filter failed" };
          if (!data || data.length === 0)
            return {
              results: [],
              message: `No people found with skills: ${skills.join(", ")}`,
            };

          let filtered = data;
          if (match_all) {
            filtered = data.filter((p) =>
              skills.every((skill) =>
                p.skills?.some(
                  (s: string) =>
                    s.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(s.toLowerCase())
                )
              )
            );
          }

          return {
            results: filtered.map(formatProfile),
            count: filtered.length,
          };
        },
      },

      get_profile_details: {
        description:
          "Get detailed profile information for a specific person by name or username. Use this to learn more about someone before recommending them.",
        inputSchema: z.object({
          name_or_username: z
            .string()
            .describe("The person's name or username to look up"),
        }),
        execute: async ({ name_or_username }: { name_or_username: string }) => {
          const term = `%${name_or_username}%`;
          const { data, error } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building, social_links"
            )
            .or(`name.ilike.${term},username.ilike.${term}`)
            .limit(3);

          if (error) return { error: "Lookup failed" };
          if (!data || data.length === 0)
            return { error: `No profile found for "${name_or_username}"` };

          return {
            profiles: data.map((p) => ({
              ...formatProfile(p),
              looking_for: p.looking_for_skills || [],
              social_links: p.social_links || {},
            })),
          };
        },
      },

      find_looking_for: {
        description:
          "Find people who are actively looking for specific skills or roles. Use this to find people who NEED the skills the user HAS, creating mutual matches.",
        inputSchema: z.object({
          skills: z
            .array(z.string())
            .describe("Skills/roles to search for in 'looking for' fields"),
        }),
        execute: async ({ skills }: { skills: string[] }) => {
          const { data, error } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building"
            )
            .not("name", "is", null)
            .overlaps("looking_for_skills", skills);

          if (error) return { error: "Search failed" };
          if (!data || data.length === 0)
            return {
              results: [],
              message: `No one is currently looking for: ${skills.join(", ")}`,
            };

          return {
            results: data.map(formatProfile),
            count: data.length,
          };
        },
      },

      browse_community: {
        description:
          "Get an overview of the community — total members, common skills, and a sample of active members. Use this when the user wants a general sense of who's in the community.",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error, count } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building",
              { count: "exact" }
            )
            .not("name", "is", null);

          if (error) return { error: "Failed to load community data" };

          const allSkills: Record<string, number> = {};
          data?.forEach((p) => {
            p.skills?.forEach((s: string) => {
              allSkills[s] = (allSkills[s] || 0) + 1;
            });
          });

          const topSkills = Object.entries(allSkills)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([skill, cnt]) => ({ skill, count: cnt }));

          return {
            total_members: count || 0,
            top_skills: topSkills,
            sample_members: (data || []).slice(0, 8).map(formatProfile),
          };
        },
      },
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}

function formatProfile(p: {
  id: string;
  name: string | null;
  username?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  currently_building?: string | null;
}) {
  const profile: Record<string, unknown> = {
    name: p.name || "Anonymous",
  };
  if (p.username) {
    profile.username = p.username;
    profile.profile_url = `/p/${p.username}`;
  }
  if (p.bio) profile.bio = p.bio;
  if (p.skills?.length) profile.skills = p.skills;
  if (p.currently_building) {
    try {
      const projects = JSON.parse(p.currently_building);
      if (Array.isArray(projects) && projects.length)
        profile.building = projects;
    } catch {
      if (p.currently_building.trim()) profile.building = p.currently_building;
    }
  }
  return profile;
}
