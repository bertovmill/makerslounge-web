import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContactEvent, ContactIntel } from "@/lib/contacts-client";

/**
 * What we know about a contact from their Luma registrations: the structured
 * intel (`metadata.intel`) and every event they were on the guest list for.
 * Read-only; the scripts in `scripts/` write it.
 */

const STATUS: Record<string, { label: string; className: string }> = {
  approved: { label: "Registered", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  invited: { label: "Invited", className: "bg-muted text-muted-foreground" },
  waitlist: { label: "Waitlist", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  pending_approval: { label: "Pending", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  declined: { label: "Declined", className: "bg-muted text-muted-foreground line-through" },
};

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Toronto",
});

function Tags({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-2.5 border-b border-border/50 last:border-0">
      <dt className="text-sm text-muted-foreground pt-0.5">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <Badge key={t} variant="secondary" className="font-normal">
            {t}
          </Badge>
        ))}
      </dd>
    </div>
  );
}

export function ContactIntelPanel({ intel, events }: { intel?: ContactIntel; events?: ContactEvent[] }) {
  const s = intel?.structured;
  const came = events?.filter((e) => e.checked_in_at).length ?? 0;
  const registered = events?.filter((e) => e.status === "approved").length ?? 0;
  const facts = [
    intel?.phase,
    intel?.industry,
    [intel?.city, intel?.country].filter(Boolean).join(", "),
  ].filter(Boolean);

  if (!s && !events?.length) return null;

  return (
    <div id="contact-intel" className="space-y-6 mb-6">
      {s && (
        <Card className="p-6">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <h3 className="font-semibold">What we know</h3>
            <span className="text-xs text-muted-foreground">
              From their event answers · {dateFmt.format(new Date(s.structured_at))}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed">{s.summary}</p>
          {facts.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">{facts.join(" · ")}</p>
          )}

          <dl className="mt-5">
            <Tags label="Roles" items={s.roles} />
            <Tags label="Skills" items={s.skills} />
            <Tags label="Can help with" items={s.can_help_with} />
            <Tags label="Needs help with" items={s.needs_help_with} />
            <Tags label="Domains" items={s.domains} />
            <Tags label="Tools" items={s.tools} />
            <Tags label="Heard about us" items={intel?.how_heard} />
          </dl>

          {s.projects.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Projects</h4>
              <ul className="space-y-3">
                {s.projects.map((p) => (
                  <li key={p.name} className="rounded-lg border border-border/60 px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.url ? (
                        <a
                          href={/^https?:\/\//.test(p.url) ? p.url : `https://${p.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </a>
                      ) : (
                        <span className="font-medium">{p.name}</span>
                      )}
                      {p.stage && (
                        <Badge variant="outline" className="font-normal capitalize">
                          {p.stage}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {!!events?.length && (
        <Card className="p-6" id="contact-events">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h3 className="font-semibold">Events</h3>
            <span className="text-sm text-muted-foreground">
              {registered} registered · {came} attended · {events.length} on guest lists
            </span>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {events.map((e) => {
                const status = STATUS[e.status] ?? { label: e.status, className: "bg-muted" };
                return (
                  <tr key={e.luma_url} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap tabular-nums">
                      {e.starts_at ? dateFmt.format(new Date(e.starts_at)) : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <a href={e.luma_url} target="_blank" rel="noreferrer" className="hover:underline">
                        {e.name}
                      </a>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      {e.checked_in_at ? (
                        <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-300">
                          Attended
                        </span>
                      ) : (
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
