import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, userId, isAdmin }: { messages: UIMessage[]; userId?: string; isAdmin?: boolean } = await req.json();

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch the current user's profile for context
  let userProfile: Record<string, unknown> | null = null;
  if (userId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("name, bio, skills, looking_for_skills, currently_building")
      .eq("id", userId)
      .single();
    userProfile = data;
  }

  const userContext = userProfile
    ? `\n\nCURRENT USER'S PROFILE:
- Name: ${userProfile.name || "Unknown"}
- Skills: ${(userProfile.skills as string[])?.join(", ") || "None listed"}
- Looking for: ${(userProfile.looking_for_skills as string[])?.join(", ") || "Not specified"}
- Building: ${userProfile.currently_building || "Not specified"}
- Bio: ${userProfile.bio || "No bio"}

Use this context to make better recommendations. For example, if they have design skills, you can tell them about people looking for designers.`
    : "";

  const systemPrompt = `You are May — the ultimate maker connector at MakersLounge. You're warm, enthusiastic, and genuinely excited about connecting builders with each other.

PERSONALITY:
- Friendly and direct — like a well-connected friend at a party who knows exactly who you should meet
- You get excited about good matches ("Oh, you HAVE to meet Sarah — she's building something very similar!")
- Brief but insightful — don't ramble, but show you understand WHY connections matter
- Use the person's first name when you know it

YOUR MISSION:
Help makers find the right people to collaborate with, get feedback from, hire, or learn from. You have full access to the MakersLounge community database.

WORKFLOW:
1. Understand what the user needs (ask a quick clarifying question if vague)
2. Search the community using your tools — try multiple approaches if the first doesn't yield great results
3. For promising matches, dig deeper: check their recent posts (search_posts), podcast appearances (search_podcasts), and research their social links (web_search_person) to give richer context
4. Present 2-5 recommendations with a clear reason for each match
5. Offer to introduce them (send_intro_message tool)

FORMATTING:
- Every person's name MUST be a clickable markdown link to their profile: [**Name**](/p/username)
- The profile_url field is included in search results — always use it for the link
- For podcast results, link to the episode using the podcast_url field: [Episode Title](/podcasts/slug)
- Show key info: skills, what they're building, and WHY they're a match
- Use bullet points for multiple recommendations
- Keep it conversational, not list-heavy

IMPORTANT:
- Never invent or hallucinate profiles — always use tools to find real people
- If no results, suggest broadening the search or try alternative terms
- You can chain multiple tool calls to refine results
- When the user wants to connect, use send_intro_message to start a conversation${isAdmin ? `

ADMIN MODE: You have access to the full community database including community contacts (event attendees who haven't signed up yet). These show as type "community_contact" in results and link to /community/[id]. When presenting community contacts, note they are "community members" (not yet registered). You can still recommend them for introductions.` : ""}${userContext}`;

  const result = streamText({
    model: "anthropic/claude-sonnet-4",
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      search_makers: {
        description:
          "Search community members by keyword. Matches against name, bio, and what they're currently building. Use for general queries like finding someone by name, topic, or interest area.",
        inputSchema: z.object({
          query: z.string().describe("Search keyword — name, topic, technology, or interest"),
        }),
        execute: async ({ query }: { query: string }) => {
          const searchTerm = `%${query}%`;
          const { data, error } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building, photo_url"
            )
            .not("name", "is", null)
            .or(
              `name.ilike.${searchTerm},bio.ilike.${searchTerm},currently_building.ilike.${searchTerm}`
            )
            .limit(15);

          if (error) return { error: "Search failed" };

          const results = (data || []).map(formatProfile);

          // Admin: also search community contacts
          if (isAdmin) {
            const { data: contacts } = await supabaseAdmin
              .from("community_contacts")
              .select("id, name, first_name, last_name, summary, skills, company, role, source, linkedin, metadata")
              .or(
                `name.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},summary.ilike.${searchTerm},company.ilike.${searchTerm}`
              )
              .limit(15);

            if (contacts) {
              results.push(...contacts.map(formatCommunityContact));
            }
          }

          if (results.length === 0)
            return { results: [], message: "No makers found matching that query" };

          return { results, count: results.length };
        },
      },

      filter_by_skills: {
        description:
          "Filter community members who have specific skills. Use when the user needs people with particular expertise like 'design', 'AI', 'React', 'marketing', etc.",
        inputSchema: z.object({
          skills: z
            .array(z.string())
            .describe("Skills to filter by (e.g. ['AI', 'Web Dev', 'Design'])"),
          match_all: z
            .boolean()
            .optional()
            .describe("If true, person must have ALL listed skills. Default false (any match)."),
        }),
        execute: async ({ skills, match_all }: { skills: string[]; match_all?: boolean }) => {
          const { data, error } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building, photo_url"
            )
            .not("name", "is", null)
            .overlaps("skills", skills);

          if (error) return { error: "Filter failed" };
          if (!data || data.length === 0)
            return {
              results: [],
              message: `No makers found with skills: ${skills.join(", ")}`,
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

          const results = filtered.map(formatProfile);

          // Admin: also search community contacts by skills
          if (isAdmin) {
            const { data: contacts } = await supabaseAdmin
              .from("community_contacts")
              .select("id, name, first_name, last_name, summary, skills, company, role, source, linkedin, metadata")
              .overlaps("skills", skills);

            if (contacts) {
              let filteredContacts = contacts;
              if (match_all) {
                filteredContacts = contacts.filter((c) =>
                  skills.every((skill) =>
                    c.skills?.some(
                      (s: string) =>
                        s.toLowerCase().includes(skill.toLowerCase()) ||
                        skill.toLowerCase().includes(s.toLowerCase())
                    )
                  )
                );
              }
              results.push(...filteredContacts.map(formatCommunityContact));
            }
          }

          return { results, count: results.length };
        },
      },

      find_looking_for: {
        description:
          "Find people who are actively looking for specific skills or roles. Use to find people who NEED what the user offers — creating mutual value.",
        inputSchema: z.object({
          skills: z
            .array(z.string())
            .describe("Skills/roles to search for in looking_for fields"),
        }),
        execute: async ({ skills }: { skills: string[] }) => {
          const { data, error } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building, photo_url"
            )
            .not("name", "is", null)
            .overlaps("looking_for_skills", skills);

          if (error) return { error: "Search failed" };
          if (!data || data.length === 0)
            return {
              results: [],
              message: `No one currently looking for: ${skills.join(", ")}`,
            };

          return {
            results: data.map(formatProfile),
            count: data.length,
          };
        },
      },

      get_maker_profile: {
        description:
          "Get detailed profile for a specific person by name or username. Use to learn more about someone before recommending or introducing them.",
        inputSchema: z.object({
          name_or_username: z.string().describe("The person's name or username"),
        }),
        execute: async ({ name_or_username }: { name_or_username: string }) => {
          const term = `%${name_or_username}%`;
          const { data, error } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building, photo_url, linkedin, twitter, website"
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
              linkedin: p.linkedin || null,
              twitter: p.twitter || null,
              website: p.website || null,
            })),
          };
        },
      },

      browse_community: {
        description:
          "Get a community overview — total members, common skills, and sample members. Use when the user wants to explore who's in the community.",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error, count } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, name, username, bio, skills, looking_for_skills, currently_building, photo_url",
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

          let communityCount = 0;
          if (isAdmin) {
            const { count: cc } = await supabaseAdmin
              .from("community_contacts")
              .select("id", { count: "exact", head: true });
            communityCount = cc || 0;

            // Include community contact skills in the tally
            const { data: contacts } = await supabaseAdmin
              .from("community_contacts")
              .select("skills");
            contacts?.forEach((c) => {
              c.skills?.forEach((s: string) => {
                allSkills[s] = (allSkills[s] || 0) + 1;
              });
            });
          }

          const topSkills = Object.entries(allSkills)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([skill, cnt]) => ({ skill, count: cnt }));

          return {
            total_members: (count || 0) + communityCount,
            registered_members: count || 0,
            community_contacts: communityCount,
            top_skills: topSkills,
            sample_members: (data || []).slice(0, 10).map(formatProfile),
          };
        },
      },

      search_podcasts: {
        description:
          "Search published podcast episodes by keyword. Matches against title, description, and transcript. Use this to find podcast episodes on a topic or featuring a specific person. Returns episode info along with guest profiles.",
        inputSchema: z.object({
          query: z.string().describe("Search keyword — topic, person name, or subject"),
        }),
        execute: async ({ query }: { query: string }) => {
          const searchTerm = `%${query}%`;
          const { data, error } = await supabaseAdmin
            .from("podcasts")
            .select("id, title, slug, description, transcript, audio_url, cover_image_url, duration_seconds, episode_number, published_at")
            .eq("is_published", true)
            .or(
              `title.ilike.${searchTerm},description.ilike.${searchTerm},transcript.ilike.${searchTerm}`
            )
            .order("published_at", { ascending: false })
            .limit(10);

          if (error) return { error: "Podcast search failed" };
          if (!data || data.length === 0)
            return { results: [], message: "No podcast episodes found matching that query" };

          // Fetch guests for each podcast
          const results = await Promise.all(
            data.map(async (podcast) => {
              const { data: guestRows } = await supabaseAdmin
                .from("podcast_guests")
                .select("profile_id")
                .eq("podcast_id", podcast.id);

              let guests: ReturnType<typeof formatProfile>[] = [];
              if (guestRows && guestRows.length > 0) {
                const { data: profiles } = await supabaseAdmin
                  .from("profiles")
                  .select("id, name, username, bio, skills, photo_url")
                  .in("id", guestRows.map((r) => r.profile_id));

                if (profiles) {
                  guests = profiles.map(formatProfile);
                }
              }

              return {
                title: podcast.title,
                description: podcast.description?.slice(0, 300) || null,
                episode_number: podcast.episode_number,
                published_at: podcast.published_at,
                podcast_url: `/podcasts/${podcast.slug}`,
                audio_url: podcast.audio_url,
                duration_seconds: podcast.duration_seconds,
                guests,
              };
            })
          );

          return { results, count: results.length };
        },
      },

      search_posts: {
        description:
          "Search through community members' recent posts/projects by keyword. Posts reveal what people are actively thinking about, building, and sharing. Use this to find people based on their recent activity and interests.",
        inputSchema: z.object({
          query: z.string().describe("Search keyword to match against post titles and descriptions"),
        }),
        execute: async ({ query }: { query: string }) => {
          const searchTerm = `%${query}%`;
          const { data, error } = await supabaseAdmin
            .from("projects")
            .select(
              "id, title, description, created_at, user_id, profiles!inner(id, name, username, bio, skills, photo_url)"
            )
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .order("created_at", { ascending: false })
            .limit(15);

          if (error) return { error: "Search failed" };
          if (!data || data.length === 0)
            return { results: [], message: "No posts found matching that query" };

          const results = data.map((post) => {
            const p = post.profiles as unknown as {
              id: string;
              name: string | null;
              username: string | null;
              bio: string | null;
              skills: string[] | null;
              photo_url: string | null;
            };
            return {
              post_title: post.title,
              post_description: post.description?.slice(0, 200) || null,
              posted_at: post.created_at,
              author: formatProfile({
                id: p.id,
                name: p.name,
                username: p.username,
                bio: p.bio,
                skills: p.skills,
                photo_url: p.photo_url,
              }),
            };
          });

          return { results, count: results.length };
        },
      },

      web_search_person: {
        description:
          "Research a person by searching the web for their social links (LinkedIn, Twitter/X, website). Use this to get deeper context about a potential match — their work history, public projects, tweets, etc. Only use after you've found a promising match via other tools.",
        inputSchema: z.object({
          person_name: z.string().describe("The person's name"),
          urls: z
            .array(z.string())
            .describe("Social URLs to research (LinkedIn, Twitter, website)"),
        }),
        execute: async ({ person_name, urls }: { person_name: string; urls: string[] }) => {
          const results: { url: string; summary: string }[] = [];

          for (const url of urls.slice(0, 3)) {
            try {
              const res = await fetch(url, {
                headers: {
                  "User-Agent": "MakersLounge-Bot/1.0",
                  Accept: "text/html",
                },
                signal: AbortSignal.timeout(5000),
              });

              if (!res.ok) {
                results.push({ url, summary: `Could not access (${res.status})` });
                continue;
              }

              const html = await res.text();
              // Extract text content, strip tags, limit to useful amount
              const textContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 2000);

              results.push({ url, summary: textContent || "No readable content" });
            } catch {
              results.push({ url, summary: "Failed to fetch" });
            }
          }

          return {
            person: person_name,
            research: results,
          };
        },
      },

      send_intro_message: {
        description:
          "Send an introductory message to a maker to start a conversation. Use when the user explicitly wants to connect with someone. This creates a new conversation thread.",
        inputSchema: z.object({
          recipient_name: z.string().describe("Name of the person to message"),
          message: z
            .string()
            .describe(
              "The intro message to send. Should be warm, mention why they want to connect, and reference something specific from the recipient's profile."
            ),
        }),
        execute: async ({
          recipient_name,
          message,
        }: {
          recipient_name: string;
          message: string;
        }) => {
          if (!userId) {
            return { error: "You need to be signed in to send messages." };
          }

          // Find recipient
          const term = `%${recipient_name}%`;
          const { data: recipients } = await supabaseAdmin
            .from("profiles")
            .select("id, name")
            .or(`name.ilike.${term},username.ilike.${term}`)
            .limit(1);

          if (!recipients || recipients.length === 0) {
            return { error: `Could not find "${recipient_name}" in the community.` };
          }

          const recipientId = recipients[0].id;
          const recipientDisplayName = recipients[0].name || recipient_name;

          if (recipientId === userId) {
            return { error: "You can't send a message to yourself!" };
          }

          // Find or create conversation (ensure participant_1 < participant_2)
          const [p1, p2] =
            userId < recipientId ? [userId, recipientId] : [recipientId, userId];

          let conversationId: string;

          const { data: existing } = await supabaseAdmin
            .from("conversations")
            .select("id")
            .eq("participant_1", p1)
            .eq("participant_2", p2)
            .single();

          if (existing) {
            conversationId = existing.id;
          } else {
            const { data: newConvo, error: convoError } = await supabaseAdmin
              .from("conversations")
              .insert({ participant_1: p1, participant_2: p2 })
              .select("id")
              .single();

            if (convoError || !newConvo) {
              return { error: "Failed to create conversation." };
            }
            conversationId = newConvo.id;
          }

          // Send the message
          const { error: msgError } = await supabaseAdmin.from("messages").insert({
            conversation_id: conversationId,
            sender_id: userId,
            content: message,
          });

          // Update last_message_at
          await supabaseAdmin
            .from("conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversationId);

          if (msgError) {
            return { error: "Failed to send message." };
          }

          return {
            success: true,
            message: `Message sent to ${recipientDisplayName}! They'll see it in their messages.`,
            conversation_id: conversationId,
          };
        },
      },
    },
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}

function formatCommunityContact(c: {
  id: string;
  name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  summary?: string | null;
  skills?: string[] | null;
  company?: string | null;
  role?: string | null;
  source?: string[] | null;
  linkedin?: string | null;
  metadata?: Record<string, string> | null;
}) {
  const displayName = c.name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
  const profile: Record<string, unknown> = {
    id: c.id,
    name: displayName,
    profile_url: `/community/${c.id}`,
    type: "community_contact",
  };
  if (c.summary) profile.bio = c.summary;
  if (c.skills?.length) profile.skills = c.skills;
  if (c.company) profile.company = c.company;
  if (c.role) profile.role = c.role;
  if (c.source?.length) profile.events_attended = c.source;
  if (c.linkedin) profile.linkedin = c.linkedin;
  // Include useful metadata (projects, superpowers, etc.)
  if (c.metadata) {
    const interesting: Record<string, string> = {};
    for (const [k, v] of Object.entries(c.metadata)) {
      const kl = k.toLowerCase();
      if (kl.includes("project") || kl.includes("skill") || kl.includes("superpower") ||
          kl.includes("building") || kl.includes("help") || kl.includes("phase")) {
        interesting[k] = v;
      }
    }
    if (Object.keys(interesting).length > 0) profile.additional_info = interesting;
  }
  return profile;
}

function formatProfile(p: {
  id: string;
  name: string | null;
  username?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  currently_building?: string | null;
  photo_url?: string | null;
}) {
  const profile: Record<string, unknown> = {
    id: p.id,
    name: p.name || "Anonymous",
  };
  if (p.username) {
    profile.username = p.username;
    profile.profile_url = `/p/${p.username}`;
  } else {
    profile.profile_url = `/profile/${p.id}`;
  }
  if (p.photo_url) profile.photo_url = p.photo_url;
  if (p.bio) profile.bio = p.bio;
  if (p.skills?.length) profile.skills = p.skills;
  if (p.currently_building) {
    try {
      const projects = JSON.parse(p.currently_building);
      if (Array.isArray(projects) && projects.length) profile.building = projects;
    } catch {
      if (p.currently_building.trim()) profile.building = p.currently_building;
    }
  }
  return profile;
}
