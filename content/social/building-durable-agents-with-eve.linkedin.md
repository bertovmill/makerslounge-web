# LinkedIn — Matias Gonzalez talk

Three options. Pick one, don't post all three.
Replace `TALK_URL` with `https://makerslounge.ca/talks/building-durable-agents-with-eve`.

Posting notes:
- LinkedIn truncates at ~210 characters on mobile. Everything above the "see more" fold has to earn the click.
- Links in the body suppress reach. If you care about reach, put the URL in the first comment and say "link in comments."
- Tag Matias and Vercel so it surfaces to their networks.
- Native video outperforms links. If you cut a 60–90s clip, post that as native video with the URL in the comment.

---

## Option A — the one idea (recommended)

"An agent is just a folder."

That's the whole framework, and it took Matias Gonzalez Fernandez 18 minutes at our agent-building workshop to convince a room of builders it was true.

Matias is a design engineer at Vercel — he builds the shader and 3D work on their public sites. But he doesn't hand-build those experiences anymore. He ships pipelines of agents that do the research and open the PRs, already tested.

Which taught him the thing this talk is actually about: shipping agents is hard.

So he built one up from nothing, live, one primitive at a time:

→ AI Gateway + AI SDK, because you want different models for different tasks
→ A sandbox, because a coding agent needs its own computer and not yours
→ Connect, because scoped short-lived tokens beat a long-lived key in an env var
→ Chat SDK, because an agent you can't talk to isn't much use
→ Workflows, because it will get rate-limited and you want it to resume, not crash

Then the punchline: that's a lot of wiring for one agent.

Eve doesn't replace those primitives. It ships them pre-wired. Your agent becomes a folder — instructions.md for the job, agent.ts for the model, and then you add capabilities as FILES. tools/ for actions. skills/ for procedures. connections/ for systems. subagents/ for delegation. evals/ for tests.

No wiring. Add a file, the agent has the capability.

But the best idea in the talk wasn't the framework.

Matias uses evals backwards. Instead of iterating on the agent until it passes, he holds the agent fixed and iterates on his LIBRARY — using the agent as a measuring instrument for whether his docs are comprehensible. Swap the model, find out how a different agent reads your documentation.

If you ship developer tooling, your docs have a second audience now. That's how you test against it.

Full talk + transcript is up. Free, you just need an account.

TALK_URL

Thanks for coming, Matias 🙏

#AI #AIAgents #Vercel #BuildInPublic #Makerslounge #TorontoTech #DeveloperTools

---

## Option B — short, hook-forward

Your docs have a second audience now, and it isn't human.

Matias Gonzalez Fernandez (design engineer at Vercel) came to our agent-building workshop to talk about Eve, Vercel's agent framework. The framework pitch is clean: an agent is a folder. instructions.md, agent.ts, then add capabilities as files — tools/, skills/, connections/, channels/, subagents/, evals/. No wiring.

But the line that stuck with the room was about evals.

Most people iterate the agent until it passes the eval. Matias holds the agent fixed and iterates his library instead — treating the agent as a test of whether his documentation is understandable. Swap the model, see how a different agent reads your docs.

18 minutes. Full talk and transcript are live.

TALK_URL

#AI #AIAgents #Vercel #DeveloperTools #Makerslounge

---

## Option C — community framing

This is what Makerslounge is for.

A design engineer from Vercel spent 18 minutes walking a room of Toronto builders through how to ship agents that don't fall over — and then stayed for questions.

Matias Gonzalez Fernandez on building durable agents with Eve:

• Why he ships agent pipelines instead of hand-writing the shader work on Vercel's sites
• Every primitive a durable agent needs, built up from scratch — Gateway, sandbox, scoped credentials, chat, checkpointed workflows
• Why Eve reduces all of that to a folder full of files
• Using evals on your own library instead of on the agent

Full talk and transcript are up — free with an account.

TALK_URL

More sessions like this coming. Come build with us.

#Makerslounge #AI #AIAgents #Vercel #TorontoTech #BuildInPublic

---

## Comment-first variant

If you go the reach route, post the body with no link and drop this as the first comment:

> Talk + full transcript here: TALK_URL
