import { NextResponse } from "next/server";

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
}

export async function POST(request: Request) {
  try {
    const { query, maxResults = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const tavilyApiKey = process.env.TAVILY_API_KEY;

    if (!tavilyApiKey) {
      // Return a helpful message if Tavily isn't configured
      return NextResponse.json({
        results: [],
        message: "Web search not configured. Add TAVILY_API_KEY to enable.",
        query,
      });
    }

    // Call Tavily API
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tavily API error:", errorText);
      throw new Error("Web search failed");
    }

    const data: TavilyResponse = await response.json();

    // Format results for use in content generation
    const formattedResults = data.results.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.content.slice(0, 300),
    }));

    return NextResponse.json({
      results: formattedResults,
      query,
    });
  } catch (error: unknown) {
    console.error("Web search API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
