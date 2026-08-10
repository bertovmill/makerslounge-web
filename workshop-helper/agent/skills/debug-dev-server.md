---
description: Use when an attendee's dev server won't start, npm run dev fails, or they paste a terminal error from scaffolding or running their agent.
---

# Debugging a failed dev server

Work through this in order. Stop as soon as one step fixes it.

1. **Get the actual error.** Ask them to paste the last 15 lines of the terminal,
   not a summary. Most reports of "it didn't work" are one of the cases below.

2. **Wrong Node version.** `npm run dev` failing immediately with a syntax error
   or an engine warning usually means Node is too old. Have them run `node -v`.
   Eve needs **Node 24+**. Fix: install from nodejs.org, or `brew install node`.

3. **Wrong directory.** `npm error enoent Could not read package.json` means they
   are outside the agent folder. Fix: `cd my-agent` (or whatever they named it
   at `npx eve@latest init`), then `npm run dev` again.

4. **Port already in use.** If it says the port is taken, another dev server is
   still running from an earlier attempt. Either use the port it falls back to,
   or stop the old one.

5. **No model credentials.** The server starts but every message errors, or it
   complains about the gateway or an API key. This is Step 2, not a broken
   install — send them to the model-connection slide with `navigate_slide`
   (`add-api-key-env-local`) and have them either run `vercel link` or paste the
   shared workshop key into `.env.local`.

6. **Still stuck.** Have them delete `node_modules` and re-run `npm install`.
   If that fails too, get them to re-scaffold in a fresh folder — during a
   90-minute workshop, starting clean beats a long debugging session.

Throughout: give one instruction at a time and wait for the result. Do not hand
an attendee a six-step plan while they are mid-error.
