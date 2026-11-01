import type { ContactEvent, ContactIntel } from "@/lib/contacts-client";
import { AdminCard, StatusPill } from "@/components/admin/AdminPage";

/**
 * What we know about a contact from their Luma registrations: the structured
 * intel (`metadata.intel`) and every event they were on the guest list for.
 * Read-only; the scripts in `scripts/` write it. These are the main column of
 * the contact detail page (`/admin/contacts/<id>`).
 */

const STATUS: Record<string, { label: string; tone: "info" | "neutral" | "warning" }> = {
  approved: { label: "Registered", tone: "info" },
  invited: { label: "Invited", tone: "neutral" },
  waitlist: { label: "Waitlist", tone: "warning" },
  pending_approval: { label: "Pending", tone: "warning" },
  declined: { label: "Declined", tone: "neutral" },
};

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Toronto",
});

function TagRow({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="grid gap-1.5 border-t border-[var(--frame-edge)] py-2.5 sm:grid-cols-[8.5rem_1fr] sm:gap-3">
      <dt className="text-[13px] text-muted-foreground sm:pt-0.5">{label}</dt>
      <dd className="flex flex-wrap gap-1">
        {items.map((t) => (
          <StatusPill key={t}>{t}</StatusPill>
        ))}
      </dd>
    </div>
  );
}

export function IntelSummaryCard({ intel }: { intel?: ContactIntel }) {
  const s = intel?.structured;
  const facts = [
    intel?.phase,
    intel?.industry,
    [intel?.city, intel?.country].filter(Boolean).join(", "),
  ].filter(Boolean);

  if (!s) {
    return (
      <AdminCard title="What we know" id="contact-intel">
        <p className="text-[13px] text-muted-foreground">
          Nothing structured yet. Intel comes from their answers on event sign-up forms, once
          the Luma import and <code className="text-xs">structure-people-intel</code> have run.
        </p>
      </AdminCard>
    );
  }

  return (
    <AdminCard
      id="contact-intel"
      title="What we know"
      action={
        <span className="text-xs text-muted-foreground">
          From their event answers · {dateFmt.format(new Date(s.structured_at))}
        </span>
      }
    >
      <p className="text-sm leading-relaxed">{s.summary}</p>
      {facts.length > 0 && <p className="mt-1.5 text-[13px] text-muted-foreground">{facts.join(" · ")}</p>}
      <dl className="mt-3 -mb-1">
        <TagRow label="Roles" items={s.roles} />
        <TagRow label="Skills" items={s.skills} />
        <TagRow label="Can help with" items={s.can_help_with} />
        <TagRow label="Needs help with" items={s.needs_help_with} />
        <TagRow label="Domains" items={s.domains} />
        <TagRow label="Tools" items={s.tools} />
        <TagRow label="Heard about us" items={intel?.how_heard} />
      </dl>
    </AdminCard>
  );
}

export function ProjectsCard({ intel }: { intel?: ContactIntel }) {
  const projects = intel?.structured?.projects ?? [];
  if (!projects.length) return null;
  return (
    <AdminCard title="Projects" id="contact-projects" bodyClassName="pb-1.5">
      <ul>
        {projects.map((p) => (
          <li key={p.name} className="border-t border-[var(--frame-edge)] py-2.5 first:border-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              {p.url ? (
                <a
                  href={/^https?:\/\//.test(p.url) ? p.url : `https://${p.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {p.name}
                </a>
              ) : (
                <span className="text-sm font-medium">{p.name}</span>
              )}
              {p.stage && <StatusPill className="capitalize">{p.stage}</StatusPill>}
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{p.description}</p>
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}

export function EventHistoryCard({ events }: { events?: ContactEvent[] }) {
  if (!events?.length) return null;
  const came = events.filter((e) => e.checked_in_at).length;
  const registered = events.filter((e) => e.status === "approved").length;

  return (
    <AdminCard
      id="contact-events"
      title="Event history"
      action={
        <span className="text-xs text-muted-foreground">
          {registered} registered · {came} attended · {events.length} on guest lists
        </span>
      }
      bodyClassName="px-0 pb-1"
    >
      <table className="w-full text-[13px]">
        <tbody>
          {events.map((e) => {
            const status = STATUS[e.status] ?? { label: e.status, tone: "neutral" as const };
            return (
              <tr key={e.luma_url} className="border-t border-[var(--frame-edge)]">
                <td className="w-28 whitespace-nowrap py-2.5 pl-4 pr-3 tabular-nums text-muted-foreground">
                  {e.starts_at ? dateFmt.format(new Date(e.starts_at)) : "—"}
                </td>
                <td className="py-2.5 pr-3">
                  <a href={e.luma_url} target="_blank" rel="noreferrer" className="hover:underline">
                    {e.name}
                  </a>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-4 text-right">
                  {e.checked_in_at ? (
                    <StatusPill tone="success">Attended</StatusPill>
                  ) : (
                    <StatusPill tone={status.tone} className={e.status === "declined" ? "line-through" : ""}>
                      {status.label}
                    </StatusPill>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </AdminCard>
  );
}
