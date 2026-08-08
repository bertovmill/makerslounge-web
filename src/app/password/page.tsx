import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, authToken, normalize } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const attempt = normalize(String(formData.get("password") ?? ""));
  const expected = normalize(process.env.WORKSHOP_PASSWORD ?? "");

  if (expected && attempt === expected) {
    (await cookies()).set(AUTH_COOKIE, await authToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    redirect("/");
  }
  redirect("/password?error=1");
}

export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-light via-brand to-brand-dark px-6 text-center">
      <div className="w-full max-w-[420px] rounded-2xl bg-white px-8 py-10 shadow-[0_20px_60px_rgba(15,28,46,0.25)]">
        <div className="mb-2 text-xs font-bold tracking-[0.18em] text-ink-muted uppercase">
          Makerslounge presents
        </div>
        <h1 className="mb-2 text-[26px] font-extrabold tracking-tight text-ink">
          Eve Agent Workshop
        </h1>
        <p className="mb-6 text-[15px] text-ink-muted">
          This page is for workshop attendees. Enter the password from your host to get started.
        </p>
        <form action={login} className="flex flex-col gap-3">
          <input
            type="password"
            name="password"
            autoFocus
            required
            placeholder="Workshop password"
            className="rounded-xl border border-[#e3ecf5] px-4 py-3 text-center text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
          {error && (
            <p className="text-sm font-semibold text-red-500">
              That&apos;s not it — double-check with a host and try again.
            </p>
          )}
          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-gradient-to-br from-brand to-brand-dark py-3 font-bold text-white transition-opacity hover:opacity-90"
          >
            Let me in →
          </button>
        </form>
      </div>
      <p className="mt-6 text-sm font-bold tracking-[0.1em] text-white/85">
        BUILD · CONNECT · CREATE
      </p>
    </main>
  );
}
