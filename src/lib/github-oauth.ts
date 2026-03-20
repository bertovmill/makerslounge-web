export function getGitHubAuthUrl() {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "read:user repo",
    redirect_uri: `${typeof window !== "undefined" ? window.location.origin : ""}/api/github/callback`,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || "";
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!res.ok) throw new Error("Failed to exchange code for token");
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}
