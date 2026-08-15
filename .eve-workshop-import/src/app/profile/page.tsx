import Image from "next/image";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { LeftSidebar } from "@/components/left-sidebar";
import { WorkshopHelperWidget } from "@/components/workshop-helper-widget";
import { DeleteAccountCard } from "@/components/delete-account-card";

function formatDate(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Attendee";
  const email = user.primaryEmailAddress?.emailAddress ?? "—";

  const details: { label: string; value: string }[] = [
    { label: "Email", value: email },
    { label: "Username", value: user.username ?? "—" },
    { label: "Joined", value: formatDate(user.createdAt) },
    { label: "Last signed in", value: formatDate(user.lastSignInAt) },
  ];

  return (
    <main className="min-h-dvh bg-[#f7fafd] pl-16 text-ink">
      <LeftSidebar />
      <WorkshopHelperWidget contextId="profile" />

      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="mb-12 text-center">
          <Badge className="mb-4 border-brand/20 bg-brand/10 text-xs font-bold tracking-[0.18em] text-brand-dark uppercase">
            Your account
          </Badge>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">Profile</h1>
          <p className="mx-auto max-w-[560px] text-sm text-ink-muted md:text-base">
            The account you&apos;re signed in with tonight.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-[#e3ecf5] bg-white p-6 shadow-[0_2px_12px_rgba(15,28,46,0.04)]">
          <div className="flex items-center gap-4">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand-dark">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-lg font-bold">{name}</div>
              <div className="truncate text-sm text-ink-muted">{email}</div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-[#e3ecf5] sm:grid-cols-2">
            {details.map(({ label, value }) => (
              <div key={label} className="bg-white px-4 py-3">
                <dt className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
                  {label}
                </dt>
                <dd className="mt-1 truncate text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <DeleteAccountCard />
      </div>
    </main>
  );
}
