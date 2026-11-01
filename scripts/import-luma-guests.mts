/**
 * Imports Luma guest-list CSVs into Neon (migration 0013).
 *
 *   node --env-file=.env.local scripts/import-luma-guests.mts [--dry-run] <guests.csv>...
 *
 * Export each event's list from Luma (Manage → Guests → Download as CSV) and
 * pass every file at once. Each file becomes rows in `luma_event_guests`, and
 * each person becomes (or updates) a `community_contacts` row:
 *
 *   * Everyone is imported, invited-only guests too; `status` tells them apart.
 *   * Contact columns are only filled when empty, so hand-written data wins.
 *   * The registration-form answers are folded into structured fields under
 *     `metadata.intel` (projects, superpowers, needs, …). Question wording
 *     differs between events, hence the pattern table below.
 *
 * The CSV has no event date, so files are matched to the public Luma calendar
 * feed by title. Recurring events share a title ("Maker Mondays: Online AI
 * Demos"); those files are paired with dates in order of their latest
 * registration. Re-running with the same files is a no-op apart from
 * `updated_at`.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import Papa from "papaparse";
import { neon } from "@neondatabase/serverless";
import { fetchLumaEvents, type LumaEvent } from "../src/lib/luma-events.ts";

type Row = Record<string, string>;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const files = args.filter((a) => !a.startsWith("--"));
if (!files.length) {
  console.error("usage: import-luma-guests.mts [--dry-run] <guests.csv>...");
  process.exit(1);
}

// Columns Luma always exports. Anything else is a registration-form question.
const STANDARD = new Set(
  "guest_id,name,first_name,last_name,email,phone_number,created_at,approval_status,checked_in_at,utm_source,utm_medium,utm_campaign,utm_term,utm_content,google_click_id,meta_click_id,x_click_id,linkedin_click_id,tiktok_click_id,reddit_click_id,yandex_click_id,referrer,referred_by,qr_code_url,amount,amount_tax,amount_discount,currency,coupon_code,eth_address,solana_address,survey_response_rating,survey_response_feedback,ticket_type_id,ticket_name".split(","),
);

// Question → structured field. First match wins, so the narrow patterns go first.
const LIST_FIELDS = ["projects", "superpowers", "needs", "how_heard", "communities", "tools", "ai_wishes"] as const;
const SCALAR_FIELDS = ["linkedin", "twitter", "company", "role", "industry", "city", "country", "phase"] as const;
type Field = (typeof LIST_FIELDS)[number] | (typeof SCALAR_FIELDS)[number];

const QUESTION_FIELDS: [RegExp, Field][] = [
  [/linkedin/i, "linkedin"],
  [/twitter/i, "twitter"],
  [/^what company do you work for|^company$/i, "company"],
  [/job title|^title$/i, "role"],
  [/^industry$/i, "industry"],
  [/what city/i, "city"],
  [/what country/i, "country"],
  [/what phase/i, "phase"],
  [/how did you hear/i, "how_heard"],
  [/community builder for/i, "communities"],
  [/favourite tool|ai tools do you use/i, "tools"],
  [/ai agent could do/i, "ai_wishes"],
  [/superpower|best teach/i, "superpowers"],
  [/help with|most challenging|anything else you need|specific you want to cover/i, "needs"],
  [/project|what will you be working on/i, "projects"],
];

const JUNK = /^(n\/?a|na|none|no|nope|nothing|nil|-+|\.+|tbd|idk|not sure|yes)$/i;

const clean = (v: string | undefined) => {
  const s = (v ?? "").trim();
  return s && !JUNK.test(s) ? s : null;
};

function linkedinUrl(v: string | null) {
  if (!v) return null;
  const path = v.match(/linkedin\.com\/[^\s,;]+/i)?.[0];
  if (path) return `https://www.${path.replace(/\/+$/, "")}`;
  return /^[\w-]{3,100}$/.test(v) ? `https://www.linkedin.com/in/${v}` : null;
}

function twitterHandle(v: string | null) {
  if (!v) return null;
  const handle = v.match(/(?:x|twitter)\.com\/(\w{1,15})/i)?.[1] ?? v.match(/^@?(\w{1,15})$/)?.[1];
  return handle ? `@${handle}` : null;
}

const iso = (v: string | undefined) => (v?.trim() ? new Date(v).toISOString() : null);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// --- Read the files and pair them with calendar events ----------------------

interface GuestFile {
  path: string;
  title: string;
  rows: Row[];
  lastRegistration: string;
  event?: LumaEvent;
}

const guestFiles: GuestFile[] = files.map((path) => {
  const { data } = Papa.parse<Row>(readFileSync(path, "utf8").replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: true,
  });
  const registered = data.filter((r) => r.approval_status !== "invited").map((r) => r.created_at);
  return {
    path,
    title: basename(path).split(" - Guests - ")[0],
    rows: data,
    lastRegistration: (registered.length ? registered : data.map((r) => r.created_at)).sort().at(-1) ?? "",
  };
});

const calendar = await fetchLumaEvents();
const byTitle = new Map<string, GuestFile[]>();
for (const f of guestFiles) byTitle.set(norm(f.title), [...(byTitle.get(norm(f.title)) ?? []), f]);

for (const [key, group] of byTitle) {
  const candidates = calendar.filter((e) => norm(e.title) === key);
  if (candidates.length !== group.length) {
    throw new Error(`"${group[0].title}": ${group.length} file(s) but ${candidates.length} calendar event(s)`);
  }
  group.sort((a, b) => a.lastRegistration.localeCompare(b.lastRegistration));
  group.forEach((f, i) => (f.event = candidates[i]));
}

// --- Build guest rows and per-person intel ----------------------------------

interface Person {
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  source: Set<string>;
  intel: Record<string, string | string[]>;
  lastSeen: string;
}

const people = new Map<string, Person>();
const guestsByEvent = new Map<LumaEvent, Map<string, Record<string, unknown>>>();
let skippedNoEmail = 0;

// Oldest event first, so later answers overwrite scalar fields.
for (const f of [...guestFiles].sort((a, b) => a.event!.start.localeCompare(b.event!.start))) {
  const guests = new Map<string, Record<string, unknown>>();
  guestsByEvent.set(f.event!, guests);

  for (const r of f.rows) {
    const email = r.email?.trim().toLowerCase();
    if (!email) {
      skippedNoEmail++;
      continue;
    }

    const answers: Record<string, string> = {};
    for (const [q, a] of Object.entries(r)) {
      if (!STANDARD.has(q) && a?.trim()) answers[q.trim()] = a.trim();
    }

    guests.set(email, {
      email,
      luma_guest_id: r.guest_id || null,
      name: clean(r.name),
      status: r.approval_status,
      registered_at: iso(r.created_at),
      checked_in_at: iso(r.checked_in_at),
      ticket_name: clean(r.ticket_name),
      referrer: clean(r.referrer),
      referred_by: clean(r.referred_by),
      utm_source: clean(r.utm_source),
      survey_rating: r.survey_response_rating ? Number(r.survey_response_rating) : null,
      survey_feedback: clean(r.survey_response_feedback),
      answers,
    });

    const p: Person = people.get(email) ?? {
      email,
      name: null,
      first_name: null,
      last_name: null,
      phone: null,
      source: new Set(),
      intel: {},
      lastSeen: "",
    };
    p.name = clean(r.name) ?? p.name;
    p.first_name = clean(r.first_name) ?? p.first_name;
    p.last_name = clean(r.last_name) ?? p.last_name;
    p.phone = clean(r.phone_number) ?? p.phone;
    p.source.add(f.title);
    p.lastSeen = f.event!.start;

    for (const [q, a] of Object.entries(answers)) {
      const field = QUESTION_FIELDS.find(([re]) => re.test(q))?.[1];
      let value = clean(a);
      if (!field || !value) continue;
      if (field === "linkedin") value = linkedinUrl(value);
      if (field === "twitter") value = twitterHandle(value);
      if (!value) continue;
      if ((LIST_FIELDS as readonly string[]).includes(field)) {
        const list = (p.intel[field] as string[] | undefined) ?? [];
        if (!list.some((x) => x.toLowerCase() === value!.toLowerCase())) list.push(value);
        p.intel[field] = list;
      } else {
        p.intel[field] = value;
      }
    }
    people.set(email, p);
  }
}

// --- Report -----------------------------------------------------------------

const sql = neon(process.env.DATABASE_URL!);
const existing = new Set(
  (await sql.query("select lower(email) e from makerslounge.community_contacts where email is not null")).map(
    (r) => r.e as string,
  ),
);

console.log("event".padEnd(64), "date      ", "rows", "reg", "in");
for (const [e, guests] of [...guestsByEvent].sort(([a], [b]) => a.start.localeCompare(b.start))) {
  const g = [...guests.values()];
  console.log(
    e.title.slice(0, 63).padEnd(64),
    e.start.slice(0, 10),
    String(g.length).padStart(4),
    String(g.filter((x) => x.status === "approved").length).padStart(3),
    String(g.filter((x) => x.checked_in_at).length).padStart(3),
  );
}
const fieldCounts = Object.fromEntries(
  [...LIST_FIELDS, ...SCALAR_FIELDS].map((f) => [f, [...people.values()].filter((p) => p.intel[f]).length]),
);
console.log({
  people: people.size,
  new: [...people.keys()].filter((e) => !existing.has(e)).length,
  existing: [...people.keys()].filter((e) => existing.has(e)).length,
  skippedNoEmail,
  withIntel: fieldCounts,
});
const missing = calendar.filter((e) => !guestsByEvent.has(e));
if (missing.length) console.log("calendar events with no file:", missing.map((e) => e.title));

if (dryRun) process.exit(0);

// --- Write ------------------------------------------------------------------

const chunk = <T,>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

for (const batch of chunk(
  [...people.values()].map((p) => {
    const { linkedin, twitter, company, role, city, country } = p.intel as Record<string, string>;
    return {
      email: p.email,
      name: p.name,
      first_name: p.first_name,
      last_name: p.last_name,
      phone: p.phone,
      linkedin: linkedin ?? null,
      twitter: twitter ?? null,
      company: company ?? null,
      role: role ?? null,
      location: [city, country].filter(Boolean).join(", ") || null,
      source: [...p.source],
      intel: { ...p.intel, last_event_at: p.lastSeen },
    };
  }),
  250,
)) {
  await sql.query(
    `insert into makerslounge.community_contacts as c
       (email, name, first_name, last_name, phone, linkedin, twitter, company, role, location, source, metadata)
     select email, name, first_name, last_name, phone, linkedin, twitter, company, role, location, source,
            jsonb_build_object('intel', intel)
       from jsonb_to_recordset($1::jsonb) as x(email text, name text, first_name text, last_name text, phone text,
            linkedin text, twitter text, company text, role text, location text, source text[], intel jsonb)
     on conflict (email) do update set
       name       = coalesce(c.name, excluded.name),
       first_name = coalesce(c.first_name, excluded.first_name),
       last_name  = coalesce(c.last_name, excluded.last_name),
       phone      = coalesce(c.phone, excluded.phone),
       linkedin   = coalesce(c.linkedin, excluded.linkedin),
       twitter    = coalesce(c.twitter, excluded.twitter),
       company    = coalesce(c.company, excluded.company),
       role       = coalesce(c.role, excluded.role),
       location   = coalesce(c.location, excluded.location),
       source     = (select array_agg(distinct s order by s) from unnest(coalesce(c.source, '{}') || excluded.source) s),
       metadata   = coalesce(c.metadata, '{}'::jsonb) || jsonb_build_object('intel', excluded.metadata -> 'intel'),
       updated_at = now()`,
    [JSON.stringify(batch)],
  );
}

for (const [e, guests] of guestsByEvent) {
  const [{ id }] = await sql.query(
    `insert into makerslounge.luma_events (name, starts_at, ends_at, location, luma_url)
     values ($1, $2, $3, $4, $5)
     on conflict (luma_url) do update set name = excluded.name, starts_at = excluded.starts_at,
       ends_at = excluded.ends_at, location = excluded.location
     returning id`,
    [e.title, e.start, e.end, e.venue, e.url],
  );
  for (const batch of chunk([...guests.values()], 400)) {
    await sql.query(
      `insert into makerslounge.luma_event_guests as g
         (luma_event_id, contact_id, luma_guest_id, email, name, status, registered_at, checked_in_at, ticket_name,
          referrer, referred_by, utm_source, survey_rating, survey_feedback, answers)
       select $2, c.id, x.luma_guest_id, x.email, x.name, x.status, x.registered_at, x.checked_in_at, x.ticket_name,
              x.referrer, x.referred_by, x.utm_source, x.survey_rating, x.survey_feedback, x.answers
         from jsonb_to_recordset($1::jsonb) as x(luma_guest_id text, email text, name text, status text,
              registered_at timestamptz, checked_in_at timestamptz, ticket_name text, referrer text, referred_by text,
              utm_source text, survey_rating smallint, survey_feedback text, answers jsonb)
         left join makerslounge.community_contacts c on lower(c.email) = x.email
       on conflict (luma_event_id, email) do update set
         contact_id = excluded.contact_id, luma_guest_id = excluded.luma_guest_id, name = excluded.name,
         status = excluded.status, registered_at = excluded.registered_at, checked_in_at = excluded.checked_in_at,
         ticket_name = excluded.ticket_name, referrer = excluded.referrer, referred_by = excluded.referred_by,
         utm_source = excluded.utm_source, survey_rating = excluded.survey_rating,
         survey_feedback = excluded.survey_feedback, answers = excluded.answers, imported_at = now()`,
      [JSON.stringify(batch), id],
    );
  }
}

console.log("imported.");
