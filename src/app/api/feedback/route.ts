import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getSiteDb } from "@/db/site";
import { feedback } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Submit feedback.
 *
 * `user_id` and `email` come from the session rather than the request. The email is
 * the point: feedback is triaged by replying to it, and a caller-supplied address
 * meant a report could arrive attributed to someone else — either sending them a
 * reply they did not ask for, or making an abusive report look like it came from
 * another member.
 *
 * `screenshot_url` is still supplied by the client, but it can only be a URL the
 * upload route agreed to mint a token for, and those are constrained to
 * `media/feedback/`.
 */
export async function POST(request: Request) {
  try {
    const profileId = await requireUser();
    const { message, screenshotUrl } = (await request.json()) as {
      message?: string;
      screenshotUrl?: string | null;
    };

    if (!message || typeof message !== "string" || message.trim() === "") {
      return badRequest("message is required");
    }

    const user = await currentUser();

    await getSiteDb()
      .insert(feedback)
      .values({
        userId: profileId,
        email: user?.primaryEmailAddress?.emailAddress ?? null,
        message: message.trim(),
        screenshotUrl: screenshotUrl ?? null,
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/feedback POST");
  }
}
