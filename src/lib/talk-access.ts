import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The email gate for recorded talks.
 *
 * A talk used to require a Makerslounge account to watch. That is a lot of
 * friction for a marketing asset, so the price is now an email address: the
 * visitor types one, it lands in `email_subscriptions`, and they get a cookie
 * that unlocks talks for six months.
 *
 * The cookie carries the email and is HMAC-signed, so a visitor can read what
 * they handed over but cannot mint themselves one without the server secret.
 * That matters because this cookie is the whole gate — `fetchTalkContent` hands
 * out the YouTube id on the strength of it.
 *
 * **This is a speed bump, not a wall, and it is a lower one than the account
 * gate it replaced.** The email is never verified, so anyone willing to type
 * `a@b.com` gets in. That is the deliberate trade: the point is capturing the
 * majority who will give a real address, not stopping the minority who won't.
 * Anything that genuinely must not leak does not belong behind this.
 */

const COOKIE_NAME = "ml_talk_access";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

/**
 * `TALK_GATE_SECRET` if set, otherwise the Clerk secret key.
 *
 * The fallback is deliberate: this must never fail open, and `CLERK_SECRET_KEY`
 * is guaranteed present in every environment that can serve a talk page. Reusing
 * an auth secret for a second purpose is not lovely — set `TALK_GATE_SECRET` in
 * Vercel to separate them, and rotating it simply signs everyone out of the gate.
 */
function gateSecret(): string | null {
  return process.env.TALK_GATE_SECRET || process.env.CLERK_SECRET_KEY || null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** `<base64url payload>.<signature>`, or null if no secret is configured. */
export function mintTalkAccessToken(email: string): string | null {
  const secret = gateSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({ e: email.toLowerCase().trim(), t: Date.now() }),
  ).toString("base64url");

  return `${payload}.${sign(payload, secret)}`;
}

/** The email the token vouches for, or null if it's absent, forged, or expired. */
export function verifyTalkAccessToken(token: string | undefined): string | null {
  if (!token) return null;

  const secret = gateSecret();
  if (!secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  // Both are base64url of a sha256 digest, so the lengths match whenever the
  // signature is well-formed; the guard is for the case where it isn't, since
  // timingSafeEqual throws on a length mismatch rather than returning false.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const { e, t } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof e !== "string" || typeof t !== "number") return null;
    if (Date.now() - t > MAX_AGE_SECONDS * 1000) return null;
    return e;
  } catch {
    return null;
  }
}

/** Reads the gate cookie in a server component or route handler. */
export async function getTalkViewerEmail(): Promise<string | null> {
  const store = await cookies();
  return verifyTalkAccessToken(store.get(COOKIE_NAME)?.value);
}

export const TALK_ACCESS_COOKIE = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
  // httpOnly so the token isn't readable from JS, which keeps an XSS on any
  // other page from harvesting gate cookies. lax is fine — nothing here is a
  // state-changing request that CSRF would care about.
  options: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  },
} as const;
