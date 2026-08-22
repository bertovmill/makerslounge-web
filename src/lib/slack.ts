/**
 * Slack pings via an Incoming Webhook.
 *
 * `SLACK_WEBHOOK_URL` points at one channel in the MakersLounge workspace — the
 * channel is baked into the webhook, not chosen here. Unset (local dev, preview
 * deploys) means every call is a silent no-op, so nothing that calls this ever
 * has to care whether Slack is wired up.
 *
 * Server-side only. A `NEXT_PUBLIC_` prefix would inline the webhook into a
 * client chunk and let anyone post to the channel.
 */
export async function notifySlack(text: string, blocks?: unknown[]): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blocks ? { text, blocks } : { text }),
    });
    if (!res.ok) {
      console.error("Slack webhook failed:", res.status, await res.text());
    }
  } catch (err) {
    // Never let a Slack outage take down the request that triggered it.
    console.error("Slack webhook error:", err);
  }
}

/** Ping the channel about a newsletter signup. `total` is the active-subscriber count. */
export async function notifyNewSubscriber(opts: {
  email: string;
  subscribedTo: string[];
  total?: number;
  returning?: boolean;
}): Promise<void> {
  const { email, subscribedTo, total, returning } = opts;
  const headline = returning
    ? `♻️ Resubscribed: ${email}`
    : `📬 New MakersLounge subscriber: ${email}`;

  const context = [
    subscribedTo.length ? `Interested in: ${subscribedTo.join(", ")}` : null,
    typeof total === "number" ? `${total} active subscriber${total === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  await notifySlack(headline, [
    { type: "section", text: { type: "mrkdwn", text: `*${headline}*` } },
    ...(context
      ? [{ type: "context", elements: [{ type: "mrkdwn", text: context }] }]
      : []),
  ]);
}
