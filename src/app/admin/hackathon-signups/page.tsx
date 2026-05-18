"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Signup {
  id: string;
  name: string;
  background: string;
  looking_for: string;
  created_at: string;
}

const ADMIN_EMAIL = "bertmill19@gmail.com";

export default function HackathonSignupsAdmin() {
  const router = useRouter();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/home");
        return;
      }
      setIsAdmin(true);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("innovation_hackathon_signups")
        .select("id, name, background, looking_for, created_at")
        .order("created_at", { ascending: false });

      if (!error) {
        setSignups((data ?? []) as Signup[]);
      }
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Innovation Hackathon
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Team signups
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Builders looking to be matched onto a team. Submissions come in via{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
              /hackathon/find-team
            </code>{" "}
            — typed form or voice with Mack.
          </p>
        </div>
        <div className="flex flex-col gap-0.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <span>Total</span>
          <span className="text-2xl font-medium tabular-nums text-foreground">
            {signups.length}
          </span>
        </div>
      </header>

      {loading ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : signups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            No signups yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Share <span className="text-foreground">/hackathon/find-team</span>{" "}
            with solo builders so they can join.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {signups.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-border bg-card/40 p-5"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-serif text-2xl tracking-tight">{s.name}</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {new Date(s.created_at).toLocaleString("en-CA", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Background" value={s.background} />
                <Field label="Looking for" value={s.looking_for} />
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {value}
      </dd>
    </div>
  );
}
