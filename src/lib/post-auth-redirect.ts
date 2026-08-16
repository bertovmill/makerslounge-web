// Where to send someone once they finish signing in.
//
// Gated pages (a talk behind an account wall) link to `/auth?next=/talks/foo`.
// The value is parked in localStorage rather than carried through the URL
// because OAuth bounces through Google and back to /auth/callback, and a new
// signup then detours through /onboarding — a query param would be lost at
// both hops.

const KEY = "pendingPostAuthRedirect";

// Only same-origin paths. `//evil.com` is a protocol-relative URL that browsers
// treat as absolute, so a leading-slash check alone is not enough.
function isSafePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export function rememberPostAuthRedirect(path: string | null | undefined): void {
  if (!path || !isSafePath(path)) return;
  try {
    localStorage.setItem(KEY, path);
  } catch {
    // Private browsing or blocked storage — the user just lands on /home.
  }
}

// Reads and clears in one go: a stale redirect would hijack the next login.
export function takePostAuthRedirect(): string | null {
  try {
    const path = localStorage.getItem(KEY);
    if (!path) return null;
    localStorage.removeItem(KEY);
    return isSafePath(path) ? path : null;
  } catch {
    return null;
  }
}
