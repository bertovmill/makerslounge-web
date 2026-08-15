import { connectSlackCredentials } from "@vercel/connect/eve";
import { slackChannel } from "eve/channels/slack";

/**
 * Puts the workshop helper in the Makers Lounge Slack workspace: it answers
 * @mentions and DMs, and replies in-thread.
 *
 * Credentials come from Vercel Connect, so there is no SLACK_BOT_TOKEN or
 * signing secret in this repo — Connect owns the bot token and verifies inbound
 * webhooks. The UID below must match the Connect client, which is created once
 * from the CLI (see workshop-helper/README-slack.md).
 */
const CONNECT_UID = process.env.SLACK_CONNECT_UID ?? "slack/workshop-helper";

export default slackChannel({
  credentials: connectSlackCredentials(CONNECT_UID),
});
