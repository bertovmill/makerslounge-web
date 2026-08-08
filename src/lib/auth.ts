export const AUTH_COOKIE = "workshop_auth";

export function normalize(password: string) {
  return password.trim().toLowerCase();
}

export async function authToken() {
  const secret = normalize(process.env.WORKSHOP_PASSWORD ?? "");
  const data = new TextEncoder().encode(`eve-workshop:${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
