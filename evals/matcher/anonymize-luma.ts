/**
 * Turn a Luma guest export into a private, anonymized eval dataset.
 *
 *   npm run eval:matcher:anonymize -- "path/to/Meetup #12 - Guests.csv" meetup-12
 *   npm run eval:matcher -- meetup-12
 *
 * Keeps only what May matches on (projects, phase, superpowers, needs) and drops
 * names, emails, phones, LinkedIn and payment fields. Emails, URLs, phone numbers
 * and @handles inside the free text are scrubbed too. Output goes to
 * evals/matcher/data/private/, which is gitignored: even scrubbed, someone's
 * project description can identify them, so real data never enters the repo.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import type { Participant } from "@/lib/meetup-matcher";
import { DATA_DIR, type MatcherDataset } from "./dataset";

const [csvPath, name] = process.argv.slice(2);
if (!csvPath || !name || !/^[a-z0-9-]+$/.test(name)) {
  console.error('Usage: npm run eval:matcher:anonymize -- "<luma export.csv>" <dataset-name (a-z, 0-9, -)>');
  process.exit(1);
}

/** Find a column by a fragment of its question, since Luma questions change between events. */
function column(headers: string[], ...fragments: string[]): string | undefined {
  return headers.find((h) => fragments.some((f) => h.toLowerCase().includes(f)));
}

function scrub(text: string | undefined): string {
  return (text ?? "")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/https?:\/\/\S+|www\.\S+/g, "[link]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .replace(/(^|\s)@\w+/g, "$1[handle]")
    .trim();
}

async function main() {
  const csv = (await readFile(csvPath, "utf8")).replace(/^﻿/, "");
  const { data, meta } = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const headers = meta.fields ?? [];

  const projectCol = column(headers, "project");
  const phaseCol = column(headers, "phase");
  // Skills and needs have been asked several ways across meetups.
  const skillCols = headers.filter((h) => /superpower|best teach|could teach/i.test(h));
  const needCol = column(headers, "need help", "could use some help", "most challenging");
  const needDetailCol = column(headers, "additional details");

  const guests = data.filter((row) => !row.approval_status || row.approval_status === "approved");
  const participants: Participant[] = guests
    .map((row, i) => {
      const id = `p${String(i + 1).padStart(3, "0")}`;
      const skills = skillCols
        .flatMap((c) => scrub(row[c]).split(/[,;\n]/))
        .map((s) => s.trim())
        .filter(Boolean);
      const need = [scrub(needCol && row[needCol]), scrub(needDetailCol && row[needDetailCol])].filter(Boolean).join(" ");
      return {
        id,
        name: `Attendee ${id.slice(1)}`,
        currently_building: scrub(projectCol && row[projectCol]) || null,
        skills: skills.length ? skills : null,
        looking_for_help: need || null,
        custom_fields: phaseCol && row[phaseCol] ? { "What phase are you in?": scrub(row[phaseCol]) } : undefined,
      };
    })
    // Someone who answered nothing gives May nothing to match on.
    .filter((p) => p.currently_building || p.skills || p.looking_for_help);

  const dataset: MatcherDataset = {
    name,
    description: `Anonymized from a Luma export (${participants.length} of ${data.length} guests). Private: never commit.`,
    meetupName: name,
    participants,
  };
  const out = path.join(DATA_DIR, "private", `${name}.json`);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(dataset, null, 2) + "\n");
  console.log(`Wrote ${participants.length} anonymized attendees to ${path.relative(process.cwd(), out)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
