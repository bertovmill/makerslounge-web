/**
 * Connection requests from the browser, via `/api/connections`.
 *
 * The route joins the counterparty's profile onto each row, so callers no longer
 * fetch the connections and then look up the other member for each one.
 */

export interface ConnectionRow {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string | null;
  /** The participant who is not the caller. Null if their profile was deleted. */
  otherId: string | null;
  otherName: string | null;
  otherUsername: string | null;
  otherPhoto: string | null;
  otherAvatarStyle: string | null;
  otherBio: string | null;
}

export async function fetchConnections(withMember?: string): Promise<ConnectionRow[]> {
  const qs = withMember ? `?with=${encodeURIComponent(withMember)}` : "";
  try {
    const res = await fetch(`/api/connections${qs}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: ConnectionRow[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[connections] unreachable:", err);
    return [];
  }
}

/** Send a request. Returns the connection id, existing or new. */
export async function requestConnection(
  recipientId: string,
): Promise<{ id: string; existed?: boolean } | null> {
  try {
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ recipientId }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: { id: string; existed?: boolean } };
    return body.data;
  } catch (err) {
    console.error("[connections] request failed:", err);
    return null;
  }
}

/** Accept or decline. Only the recipient can; the route enforces it. */
export async function respondToConnection(
  id: string,
  status: "accepted" | "declined",
): Promise<boolean> {
  try {
    const res = await fetch("/api/connections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, status }),
    });
    return res.ok;
  } catch (err) {
    console.error("[connections] respond failed:", err);
    return false;
  }
}

export async function removeConnection(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/connections?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    console.error("[connections] remove failed:", err);
    return false;
  }
}
