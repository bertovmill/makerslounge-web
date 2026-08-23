# YouTube upload metadata

Visibility: **Unlisted** (not Private — private videos can't be embedded for
other viewers, so the player on /talks would render an empty black box).

---

## Title

Pick one. YouTube truncates around 60 characters in most surfaces, so the
front-loaded ones are safer.

**A (recommended, 58 chars)**
```
Building Durable Agents with Eve — Matias Gonzalez, Vercel
```

**B — the idea (57 chars)**
```
An Agent Is Just a Folder: Building Durable Agents with Eve
```

**C — plainest (49 chars)**
```
Matias Gonzalez (Vercel) on Vercel's Eve Framework
```

---

## Description

Only the first ~150 characters show above "Show more", so the hook is up top and
the link is early.

```
Matias Gonzalez Fernandez, a design engineer at Vercel, on why shipping agents is hard — and how Eve reduces a durable agent to a folder full of files.

Recorded at the Makerslounge agent-building workshop in Toronto, August 2026.

Full talk with transcript: https://www.makerslounge.ca/talks/building-durable-agents-with-eve
Write-up: https://www.makerslounge.ca/blog/building-durable-agents-with-eve

Matias builds the shader and 3D work on Vercel's public sites — but he doesn't hand-build those experiences anymore. He ships pipelines of agents that do the research and open the PRs, already tested. That taught him what this talk is actually about: assembling a durable agent yourself means wiring together a lot of primitives.

So he builds one up from nothing, live, one piece at a time — AI Gateway and the AI SDK for calling models, a sandbox so the agent gets its own computer, Connect for short-lived scoped credentials instead of long-lived keys in env vars, the Chat SDK so you can actually talk to it, and Workflows so a rate limit resumes from a checkpoint instead of taking down the run.

Then the punchline: that's a lot of setup for one agent. Eve doesn't replace those primitives — it ships them pre-wired, so an agent becomes a folder. instructions.md for the job, agent.ts for the model, then capabilities as files: tools/ for actions, skills/ for procedures, connections/ for systems, channels/ for reaching in, subagents/ for delegation, evals/ for tests.

The best idea in the talk is the one about evals. Most people iterate the agent until it passes. Matias holds the agent fixed and iterates his LIBRARY instead — using the agent as a measuring instrument for whether his documentation is comprehensible to one. If you ship developer tooling, your docs have a second audience now, and this is how you test against it.

CHAPTERS
00:00 Who Matias is, and what he actually builds at Vercel
01:05 Why he ships agent pipelines (and the navmesh bug on Vercel Ship)
02:26 What he learned: shipping agents is hard
03:05 Eve, "the Next.js for agents"
03:47 Building an agent with no framework — calling a model
05:05 Giving the agent its own computer: sandboxes
05:47 Credentials without long-lived tokens: Connect
06:49 Talking to the agent: the Chat SDK
07:20 When it breaks: Workflows and checkpointing
08:27 The punchline — this is a lot of work
08:50 Eve as the reusable layer
09:23 An agent is just a folder
09:42 The two starting files: instructions.md and agent.ts
10:19 tools/ — actions the agent can take
11:09 skills/ — instructions loaded on demand
11:50 connections/ — reaching out to external systems
12:33 channels/ — how you reach in
13:04 evals/ — tests for agents
13:52 Point your evals at your own documentation
14:38 Tool approvals, context compaction, subagent workflows
15:05 Extensions and schedules
15:53 You're not locked in: Ollama, Docker, network policy
16:43 Recap
17:13 Getting started with npx eve init

LINKS
Eve docs: https://eve.dev/docs
Matias on X: https://x.com/MatiIsNotFound
Makerslounge: https://www.makerslounge.ca

#AI #AIAgents #Vercel #Eve #DeveloperTools #TypeScript
```

---

## Other fields

- **Playlist**: Makerslounge Talks (create it if it doesn't exist — worth having
  before there are several)
- **Category**: Science & Technology
- **Language**: English
- **Recording date**: 2026-08-10
- **Tags**: `eve framework`, `vercel eve`, `ai agents`, `durable agents`,
  `ai sdk`, `vercel ai gateway`, `agent framework`, `typescript agents`,
  `makerslounge`, `matias gonzalez`
- **Thumbnail**: skip it — the talk page pulls
  `img.youtube.com/vi/<id>/maxresdefault.jpg` automatically, so YouTube's
  auto-thumbnail becomes the card image on /talks. Upload a custom one only if
  you want to brand that card.
- **"Altered or synthetic content" disclosure**: No.
- **Comments**: your call. Unlisted videos still accept them.
