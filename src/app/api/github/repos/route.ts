import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("github_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No GitHub token" }, { status: 401 });
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // Fetch user profile and repos in parallel
    const [userRes, reposRes] = await Promise.all([
      fetch("https://api.github.com/user", { headers }),
      fetch("https://api.github.com/user/repos?sort=updated&per_page=30&type=owner", { headers }),
    ]);

    if (!userRes.ok || !reposRes.ok) {
      throw new Error("Failed to fetch GitHub data");
    }

    const user = await userRes.json();
    const repos = await reposRes.json();

    // Collect unique languages
    const languages = new Set<string>();
    const formattedRepos = repos.map((repo: Record<string, unknown>) => {
      if (repo.language) languages.add(repo.language as string);
      return {
        name: repo.name,
        description: repo.description,
        language: repo.language,
        topics: repo.topics || [],
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at,
      };
    });

    return NextResponse.json({
      name: user.name || user.login,
      bio: user.bio,
      blog: user.blog,
      twitter_username: user.twitter_username,
      repos: formattedRepos,
      languages: Array.from(languages),
    });
  } catch (error) {
    console.error("GitHub repos error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repos" },
      { status: 500 }
    );
  }
}
