"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Signup {
  id: string;
  name: string;
  email: string | null;
  background: string;
  looking_for: string;
  created_at: string;
}

const ADMIN_EMAIL = "bertmill19@gmail.com";

function csvEscape(value: string): string {
  if (value == null) return "";
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

function buildCsv(rows: Signup[]): string {
  const header = ["id", "name", "email", "background", "looking_for", "created_at"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.id),
        csvEscape(r.name),
        csvEscape(r.email ?? ""),
        csvEscape(r.background),
        csvEscape(r.looking_for),
        csvEscape(r.created_at),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function download(filename: string, mime: string, body: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function timestampForFilename(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

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

  const exportCsv = () => {
    const ts = timestampForFilename();
    download(
      `hackathon-signups_${ts}.csv`,
      "text/csv;charset=utf-8",
      buildCsv(signups),
    );
  };

  const exportJson = () => {
    const ts = timestampForFilename();
    download(
      `hackathon-signups_${ts}.json`,
      "application/json",
      JSON.stringify(signups, null, 2),
    );
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            2026 Innovation Hackathon
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Team signups
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Submissions from{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
              /hackathons/2026-innovation-hackathon/find-team
            </code>{" "}
            — typed form or voice with Mack.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Total{" "}
            <span className="ml-1 text-base font-medium tabular-nums text-foreground">
              {signups.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={signups.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <FileSpreadsheet className="size-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportJson}
              disabled={signups.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <FileJson className="size-3.5" />
              Export JSON
            </button>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-card/40">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : signups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Download className="size-5 text-muted-foreground" />
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              No signups yet
            </p>
            <p className="text-sm text-muted-foreground">
              Share <span className="text-foreground">/hackathons/2026-innovation-hackathon/find-team</span>{" "}
              with solo builders so they can join.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-border bg-muted/30 text-left">
                <tr>
                  <Th>Name</Th>
                  <Th>Background</Th>
                  <Th>Looking for</Th>
                  <Th className="whitespace-nowrap">Submitted</Th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s, i) => (
                  <tr
                    key={s.id}
                    className={
                      "border-b border-border last:border-b-0 align-top transition-colors hover:bg-muted/40 " +
                      (i % 2 === 0 ? "bg-transparent" : "bg-muted/10")
                    }
                  >
                    <Td className="whitespace-nowrap font-medium text-foreground">
                      {s.name}
                    </Td>
                    <Td className="min-w-[18rem] max-w-[24rem] whitespace-pre-wrap text-muted-foreground">
                      {s.background}
                    </Td>
                    <Td className="min-w-[18rem] max-w-[24rem] whitespace-pre-wrap text-muted-foreground">
                      {s.looking_for}
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {new Date(s.created_at).toLocaleString("en-CA", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground " +
        className
      }
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={"px-4 py-4 leading-relaxed " + className}>{children}</td>;
}
