---
description: Use when an attendee asks how an eve project is organised, where to put a tool, skill, channel, or connection, or what a folder under agent/ is for.
---

# Explaining the eve project layout

Eve is **filesystem-first**: a file's location is its registration. There is no
registry to update and no `name:` field to write — `agent/tools/get_weather.ts`
*is* the `get_weather` tool.

Lead with that idea, then map only the folder they asked about:

| Path                 | What lives there                                            |
| -------------------- | ----------------------------------------------------------- |
| `agent/agent.ts`     | Model choice and runtime config                              |
| `agent/instructions.md` | The always-on system prompt — identity and standing rules |
| `agent/tools/`       | Typed functions the model can call (`defineTool` + a Zod schema) |
| `agent/skills/`      | Markdown procedures loaded on demand, like this one          |
| `agent/channels/`    | Entry points — the HTTP API, Slack, webhooks                 |
| `agent/connections/` | MCP and OpenAPI services the agent talks out to              |
| `agent/lib/`         | Shared helpers — imported, never mounted as a capability     |

## The distinction attendees most often miss

**Instructions vs skills.** `instructions.md` loads on *every* turn, so keep it
short — identity, tone, standing rules. Files under `skills/` load *only* when
the model decides they're relevant. Situational procedures belong in a skill.

**Skills vs tools.** A skill adds *instructions*; a tool adds *the ability to do
something*. If they need the agent to actually fetch, write, or compute, that's a
tool, not a skill.

## Make it concrete

This very agent is the live example, so point at it rather than abstracting:
`get_workshop_step` and `navigate_slide` are tools, this file is a skill, and the
chat they're using is the `eve` channel. If they want to see the shape of a real
tool, tell them to open `agent/tools/get_workshop_step.ts` — about 20 lines.
