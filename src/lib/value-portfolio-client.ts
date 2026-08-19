/**
 * Value portfolio items, via `/api/value-portfolio`.
 *
 * Reads are public; writes are owner-scoped by the route, so `user_id` is no longer
 * sent from the browser.
 */

export interface ValuePortfolioItem {
  id: string;
  userId: string;
  title: string;
  category: string;
  valueDescription: string | null;
  mediaUrls: string[] | null;
  links: unknown;
  createdAt: string | null;
  updatedAt: string | null;
}

export async function fetchPortfolio(userId?: string): Promise<ValuePortfolioItem[]> {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  try {
    const res = await fetch(`/api/value-portfolio${qs}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: ValuePortfolioItem[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[portfolio] unreachable:", err);
    return [];
  }
}

async function write(method: "POST" | "PATCH", payload: Record<string, unknown>) {
  try {
    const res = await fetch("/api/value-portfolio", {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as {
      data?: { id: string };
      error?: string;
      detail?: string;
    };
    if (!res.ok) return { success: false as const, error: body.detail || body.error };
    return { success: true as const, id: body.data?.id };
  } catch (err) {
    console.error("[portfolio] write failed:", err);
    return { success: false as const, error: "failed" };
  }
}

export function createPortfolioItem(input: Record<string, unknown>) {
  return write("POST", input);
}

export function updatePortfolioItem(id: string, input: Record<string, unknown>) {
  return write("PATCH", { id, ...input });
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/value-portfolio?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    console.error("[portfolio] delete failed:", err);
    return false;
  }
}
