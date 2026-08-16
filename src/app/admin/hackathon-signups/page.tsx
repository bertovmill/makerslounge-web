"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileJson, FileSpreadsheet, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const MIN_FINALISTS = 6;
const MAX_FINALISTS = 9;

interface Signup {
  id: string;
  name: string;
  email: string | null;
  background: string;
  looking_for: string;
  matched_team: string | null;
  is_finalist: boolean;
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
  const header = ["id", "name", "email", "background", "looking_for", "matched_team", "created_at"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.id),
        csvEscape(r.name),
        csvEscape(r.email ?? ""),
        csvEscape(r.background),
        csvEscape(r.looking_for),
        csvEscape(r.matched_team ?? ""),
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
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      const user = authUser;
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
        .select("id, name, background, looking_for, matched_team, is_finalist, created_at")
        .order("created_at", { ascending: false });

      if (!error) {
        const rows = (data ?? []) as Signup[];
        setSignups(rows);
        setSelectedIds(new Set(rows.filter((r) => r.is_finalist).map((r) => r.id)));
      }
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  const toggleFinalist = (id: string) => {
    setSelectedIds((prev) => {
      const wasSelected = prev.has(id);
      const next = new Set(prev);
      if (wasSelected) {
        next.delete(id);
      } else {
        next.add(id);
      }
      supabase
        .from("innovation_hackathon_signups")
        .update({ is_finalist: !wasSelected })
        .eq("id", id)
        .then(() => {});
      return next;
    });
  };

  const finalists = signups.filter((s) => selectedIds.has(s.id));

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

  const exportFinalistsCsv = () => {
    const ts = timestampForFilename();
    download(
      `hackathon-finalists_${ts}.csv`,
      "text/csv;charset=utf-8",
      buildCsv(finalists),
    );
  };

  const exportFinalistsJson = () => {
    const ts = timestampForFilename();
    download(
      `hackathon-finalists_${ts}.json`,
      "application/json",
      JSON.stringify(finalists, null, 2),
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
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Total{" "}
              <span className="ml-1 text-base font-medium tabular-nums text-foreground">
                {signups.length}
              </span>
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Finalists{" "}
              <span className={`ml-1 text-base font-medium tabular-nums ${
                selectedIds.size === 0
                  ? "text-muted-foreground"
                  : selectedIds.size >= MIN_FINALISTS && selectedIds.size <= MAX_FINALISTS
                  ? "text-green-600 dark:text-green-400"
                  : selectedIds.size > MAX_FINALISTS
                  ? "text-red-500"
                  : "text-amber-500"
              }`}>
                {selectedIds.size}
              </span>
              <span className="ml-0.5 text-muted-foreground/60">/{MAX_FINALISTS}</span>
            </span>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5">
              <Trophy className="size-3 text-amber-500" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-500">
                {selectedIds.size < MIN_FINALISTS
                  ? `${MIN_FINALISTS - selectedIds.size} more to go`
                  : selectedIds.size > MAX_FINALISTS
                  ? `${selectedIds.size - MAX_FINALISTS} over limit`
                  : "Good range"}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={exportFinalistsCsv}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
                >
                  <FileSpreadsheet className="size-3.5" />
                  Finalists CSV
                </button>
                <button
                  type="button"
                  onClick={exportFinalistsJson}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
                >
                  <FileJson className="size-3.5" />
                  Finalists JSON
                </button>
              </>
            )}
            <button
              type="button"
              onClick={exportCsv}
              disabled={signups.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <FileSpreadsheet className="size-3.5" />
              All CSV
            </button>
            <button
              type="button"
              onClick={exportJson}
              disabled={signups.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <FileJson className="size-3.5" />
              All JSON
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
                  <th className="w-10 px-4 py-3" />
                  <Th>Name</Th>
                  <Th>Background</Th>
                  <Th>Looking for</Th>
                  <Th className="whitespace-nowrap">Matched on Team</Th>
                  <Th className="whitespace-nowrap">Submitted</Th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s, i) => {
                  const isFinalist = selectedIds.has(s.id);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => toggleFinalist(s.id)}
                      className={
                        "cursor-pointer border-b border-border last:border-b-0 align-top transition-colors " +
                        (isFinalist
                          ? "bg-amber-500/8 hover:bg-amber-500/12"
                          : i % 2 === 0
                          ? "bg-transparent hover:bg-muted/40"
                          : "bg-muted/10 hover:bg-muted/40")
                      }
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isFinalist}
                          onChange={() => toggleFinalist(s.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="size-4 cursor-pointer rounded accent-amber-500"
                        />
                      </td>
                      <Td className="whitespace-nowrap font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                          {isFinalist && <Trophy className="size-3 shrink-0 text-amber-500" />}
                          {s.name}
                        </span>
                      </Td>
                      <Td className="min-w-[18rem] max-w-[24rem] whitespace-pre-wrap text-muted-foreground">
                        {s.background}
                      </Td>
                      <Td className="min-w-[18rem] max-w-[24rem] whitespace-pre-wrap text-muted-foreground">
                        {s.looking_for}
                      </Td>
                      <Td className="whitespace-nowrap">
                        {s.matched_team ? (
                          <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                            s.matched_team === "Team 1"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : s.matched_team === "Team 2"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-green-500/10 text-green-600 dark:text-green-400"
                          }`}>
                            {s.matched_team}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/40 text-xs">—</span>
                        )}
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
                  );
                })}
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
