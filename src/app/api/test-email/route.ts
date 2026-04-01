import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: "MakersLounge <hello@makerslounge.ca>",
    to: "bertmill19@gmail.com",
    subject: "MakersLounge email test",
    html: "<p>If you're reading this, Resend is working!</p>",
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id });
}
