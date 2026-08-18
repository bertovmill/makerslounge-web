import { NextRequest, NextResponse } from "next/server";
import { getSiteDb } from "@/db/site";
import { innovationHackathonSignups } from "@/db/site/schema";
import { badRequest, handleApiError } from "@/lib/api/respond";

const MIN_FREEFORM = 20;
const MAX_FREEFORM = 600;
const MAX_NAME = 80;

/** Open, like the other event forms — matches the table's permissive policy. */
export async function POST(request: NextRequest) {
  try {
    return await findTeam(request);
  } catch (err) {
    return handleApiError(err, "api/hackathon/find-team");
  }
}

async function findTeam(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { name, email, background, looking_for } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    background?: unknown;
    looking_for?: unknown;
  };

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > MAX_NAME
  ) {
    return badRequest("Name is required");
  }

  if (
    typeof email !== "string" ||
    email.trim().length === 0 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return badRequest("A valid email is required");
  }

  if (
    typeof background !== "string" ||
    background.trim().length < MIN_FREEFORM ||
    background.trim().length > MAX_FREEFORM
  ) {
    return badRequest(`Background must be at least ${MIN_FREEFORM} characters`);
  }

  if (
    typeof looking_for !== "string" ||
    looking_for.trim().length < MIN_FREEFORM ||
    looking_for.trim().length > MAX_FREEFORM
  ) {
    return badRequest(`Tell us who you're looking for (at least ${MIN_FREEFORM} characters)`);
  }

  await getSiteDb().insert(innovationHackathonSignups).values({
    name: name.trim(),
    email: email.trim(),
    background: background.trim(),
    lookingFor: looking_for.trim(),
  });

  return NextResponse.json({ ok: true });
}
