import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(request: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json(
      { error: "RESEND_API_KEY or RESEND_FROM_EMAIL not set" },
      { status: 500 }
    );
  }

  const to = request.nextUrl.searchParams.get("to") ?? "bertmill19@gmail.com";

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: `MakersLounge <${process.env.RESEND_FROM_EMAIL}>`,
    to,
    subject: "MakersLounge email test",
    html: "<p>If you're reading this, Resend is working!</p>",
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id, to });
}
