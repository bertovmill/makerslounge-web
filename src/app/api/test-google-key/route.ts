import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GOOGLE_CLOUD_API_KEY;
  if (!key) return NextResponse.json({ error: "GOOGLE_CLOUD_API_KEY not set" }, { status: 500 });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with just: API key works!" }] }] }),
    }
  );

  const data = await res.json();
  return NextResponse.json({ status: res.status, data });
}
