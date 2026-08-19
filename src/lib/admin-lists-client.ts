/**
 * Small admin list resources: applications, hackathon signups, the feedback queue.
 *
 * One module because each is a single screen with a list and a status toggle, and three
 * near-identical files would be worse than one. All three routes are admin-only.
 */

async function getList<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: T[] };
    return body.data ?? [];
  } catch (err) {
    console.error(`[admin] ${url} unreachable:`, err);
    return [];
  }
}

async function patch(url: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error(`[admin] ${url} patch failed:`, err);
    return false;
  }
}

// ---- applications ----------------------------------------------------------

/** All applications, newest first. Filtering by status happens client-side. */
export function fetchApplications<T>(): Promise<T[]> {
  return getList<T>("/api/applications");
}

/**
 * Set an application's status.
 *
 * `reviewed_by` and `reviewed_at` are stamped by the route — the client used to send
 * both, which meant the audit trail of who decided what was whatever the browser said.
 */
export function setApplicationStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
): Promise<boolean> {
  return patch("/api/applications", { id, status });
}

// ---- hackathon signups -----------------------------------------------------

export function fetchHackathonSignups<T>(): Promise<T[]> {
  return getList<T>("/api/hackathon/signups");
}

export function setSignupFinalist(id: string, isFinalist: boolean): Promise<boolean> {
  return patch("/api/hackathon/signups", { id, isFinalist });
}

// ---- feedback --------------------------------------------------------------

export function fetchFeedbackQueue<T>(): Promise<T[]> {
  return getList<T>("/api/feedback");
}

export function setFeedbackCompleted(id: string, completed: boolean): Promise<boolean> {
  return patch("/api/feedback", { id, completed });
}
