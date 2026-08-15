# Connecting the workshop helper to Makers Lounge Slack

`agent/channels/slack.ts` is written and ready. The remaining steps install a
Slack app into the workspace, which needs a browser OAuth flow — so they have to
be run by someone with permission to add apps to Makers Lounge.

## 1. Update the Vercel CLI

The Slack setup needs a current CLI (this repo was last seen on 56.3.1):

```bash
npm i -g vercel@latest
```

## 2. Create the Connect client and point it at eve's Slack route

```bash
vercel connect create slack --triggers
```

This opens the browser to authorize the Makers Lounge workspace and prints a
UID, e.g. `slack/workshop-helper`. `--triggers` enables Slack Event
Subscriptions — without it Slack never delivers `app_mention` or `message.im`.

The client is created at Connect's default path, but eve serves its Slack
webhook at `/eve/v1/slack`, so re-point the trigger:

```bash
vercel connect detach <uid> --yes
vercel connect attach <uid> --triggers --trigger-path /eve/v1/slack --yes
```

## 3. Match the UID

If the UID from step 2 is not `slack/workshop-helper`, set it rather than
editing the channel file:

```bash
vercel env add SLACK_CONNECT_UID production
```

## 4. Deploy

```bash
VERCEL_USE_EXPERIMENTAL_FRAMEWORKS=1 vercel deploy --prod
```

The flag lets the CLI recognise eve as a framework during the build.

## 5. Check it

Invite the bot to the channel and `@mention` it. It should reply in-thread. The
channels icon in the web widget reads `/eve/v1/info`, so Slack appears there
automatically once the channel is live — no frontend change needed.
