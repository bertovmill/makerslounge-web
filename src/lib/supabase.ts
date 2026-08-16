// Plain client, not `@supabase/ssr`'s createBrowserClient: that one registers
// its own onAuthStateChange listener to sync auth cookies, which the
// `accessToken` option forbids ("accessing supabase.auth.onAuthStateChange is
// not possible"). There is no Supabase session left to sync.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Supabase is the database only — Clerk owns authentication.
 *
 * `accessToken` hands PostgREST the Clerk session token so RLS can resolve the
 * caller: every policy goes through `current_profile_id()`, which reads the
 * JWT subject and maps a Clerk `user_xxx` to a profile uuid. Supabase must
 * trust Clerk as a third-party issuer (Authentication → Third-Party Auth) or
 * these tokens are rejected and every query returns nothing.
 *
 * Setting this option disables supabase-js's own `auth` namespace, which is
 * why no `supabase.auth.*` calls remain anywhere in the app. Sign-in, sign-out
 * and session state all come from Clerk.
 */
async function clerkAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null

  // Read Clerk off the window rather than through a hook: this module is a
  // singleton created outside React and has no access to context.
  const clerk = (window as unknown as {
    Clerk?: { session?: { getToken: () => Promise<string | null> } }
  }).Clerk

  if (!clerk?.session) return null

  try {
    return await clerk.session.getToken()
  } catch {
    // A failed refresh degrades to an anonymous request rather than throwing
    // inside every query on the page.
    return null
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: clerkAccessToken,
})
