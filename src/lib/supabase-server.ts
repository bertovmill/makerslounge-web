// Plain client rather than `@supabase/ssr`'s createServerClient: that one
// registers an onAuthStateChange listener to sync auth cookies, which the
// `accessToken` option forbids outright. There is no Supabase session left to
// sync — Clerk owns the session and its token is what gets passed through.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Supabase client for server components and route handlers.
 *
 * Passing Clerk's token is what keeps RLS working: every policy resolves the
 * caller through `current_profile_id()`, which reads the JWT subject. Without
 * it PostgREST sees an anonymous request, every row-owner policy denies, and a
 * signed-in user silently sees nothing.
 */
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => {
        try {
          const { getToken } = await auth()
          return await getToken()
        } catch {
          // Outside a request context (a build-time prerender, say) there is no
          // session, and an anonymous read is the correct fallback.
          return null
        }
      },
    }
  )
}
