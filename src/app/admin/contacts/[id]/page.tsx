"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchContact,
  createContact,
  updateContact,
  deleteContact,
  type CommunityContact,
} from "@/lib/contacts-client";
import {
  AdminPage,
  PageHeader,
  AdminCard,
  CardAction,
  StatusPill,
  Initials,
} from "@/components/admin/AdminPage";
import { IntelSummaryCard, ProjectsCard, EventHistoryCard } from "@/components/admin/ContactIntelPanel";
import { fetchProfile } from "@/lib/profiles-client";
import { useAuth } from "@/context/AuthContext";

interface ContactForm {
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  notes: string;
  skills: string;
  company: string;
  role: string;
  source: string;
  phone: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  website: string;
}

const emptyForm: ContactForm = {
  email: "",
  first_name: "",
  last_name: "",
  name: "",
  notes: "",
  skills: "",
  company: "",
  role: "",
  source: "",
  phone: "",
  linkedin: "",
  twitter: "",
  instagram: "",
  website: "",
};

interface MatchedProfile {
  id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
}

/** Which card's Edit dialog is open. */
type Section = "contact" | "tags" | "notes";

const SECTION_TITLES: Record<Section, string> = {
  contact: "Edit contact",
  tags: "Edit tags",
  notes: "Edit notes",
};

function toForm(c: CommunityContact): ContactForm {
  return {
    email: c.email || "",
    first_name: c.first_name || "",
    last_name: c.last_name || "",
    name: c.name || "",
    notes: c.notes || "",
    skills: (c.skills || []).join(", "),
    company: c.company || "",
    role: c.role || "",
    source: (c.source || []).join(", "),
    phone: c.phone || "",
    linkedin: c.linkedin || "",
    twitter: c.twitter || "",
    instagram: c.instagram || "",
    website: c.website || "",
  };
}

function toPayload(form: ContactForm) {
  const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    email: form.email.trim().toLowerCase(),
    first_name: form.first_name.trim() || null,
    last_name: form.last_name.trim() || null,
    name: form.name.trim() || null,
    notes: form.notes.trim() || null,
    skills: list(form.skills),
    company: form.company.trim() || null,
    role: form.role.trim() || null,
    source: list(form.source),
    phone: form.phone.trim() || null,
    linkedin: form.linkedin.trim() || null,
    twitter: form.twitter.trim() || null,
    instagram: form.instagram.trim() || null,
    website: form.website.trim() || null,
    // No `updated_at`: the route stamps it, so it cannot be backdated from a
    // client with a wrong clock.
  };
}

/** Links are stored as typed: a URL, a bare domain, or a handle. */
function linkHref(value: string, handleBase?: string) {
  if (/^https?:\/\//i.test(value)) return value;
  if (handleBase && !value.includes(".")) return `${handleBase}${value.replace(/^@/, "")}`;
  return `https://${value}`;
}

function displayName(c: CommunityContact) {
  return c.name || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Unnamed";
}

function Field({
  label,
  children,
  wide,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "col-span-2 block" : "block"}>
      <span className="mb-1 block text-[13px] font-medium">{label}</span>
      {children}
    </label>
  );
}

export default function ContactDetailPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [contact, setContact] = useState<CommunityContact | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [editing, setEditing] = useState<Section | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<MatchedProfile | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !isAdmin) return;

    const load = async () => {
      const data = await fetchContact(id);
      if (!data) {
        setError("Contact not found");
        setLoading(false);
        return;
      }
      setContact(data);
      setLoading(false);

      if (data.matched_profile_id) {
        const profile = await fetchProfile(data.matched_profile_id);
        if (profile) setMatchedProfile(profile);
      }
    };

    load();
  }, [id, isNew, isAdmin]);

  const openEdit = (section: Section) => {
    if (contact) setForm(toForm(contact));
    setError(null);
    setEditing(section);
  };

  const save = async () => {
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(form);
      const result = isNew ? await createContact(payload) : await updateContact(id, payload);
      if (!result.success) throw new Error(result.error ?? "Save failed");
      if (isNew) {
        router.push(result.data?.id ? `/admin/contacts/${result.data.id}` : "/admin/contacts");
        return;
      }
      // The PATCH returns the row without its event history, so keep that.
      setContact((prev) => (prev ? { ...prev, ...payload, ...result.data, events: prev.events } : prev));
      setEditing(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      // The route returns 409 with this message for the unique email index.
      if (msg.includes("already exists") || msg.includes("community_contacts_email_idx")) {
        setError("A contact with this email already exists");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async () => {
    if (!contact) return;
    const visibility = contact.visibility === "public" ? "private" : "public";
    const result = await updateContact(contact.id, { visibility });
    if (result.success) setContact({ ...contact, visibility });
  };

  const remove = async () => {
    if (!contact || !confirm(`Delete ${displayName(contact)}? This cannot be undone.`)) return;
    if (await deleteContact(contact.id)) router.push("/admin/contacts");
  };

  const update = (field: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Access denied
      </div>
    );
  }

  const textareaClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const contactFields = (
    <>
      <Field label={<>Email <span className="text-destructive">*</span></>} wide>
        <Input type="email" value={form.email} onChange={update("email")} placeholder="email@example.com" required />
      </Field>
      <Field label="First name">
        <Input value={form.first_name} onChange={update("first_name")} />
      </Field>
      <Field label="Last name">
        <Input value={form.last_name} onChange={update("last_name")} />
      </Field>
      <Field label="Display name" wide>
        <Input value={form.name} onChange={update("name")} placeholder="Full display name (optional)" />
      </Field>
      <Field label="Company">
        <Input value={form.company} onChange={update("company")} />
      </Field>
      <Field label="Role">
        <Input value={form.role} onChange={update("role")} placeholder="Job title / role" />
      </Field>
      <Field label="Phone" wide>
        <Input value={form.phone} onChange={update("phone")} />
      </Field>
      <Field label="LinkedIn">
        <Input value={form.linkedin} onChange={update("linkedin")} placeholder="LinkedIn URL" />
      </Field>
      <Field label="X / Twitter">
        <Input value={form.twitter} onChange={update("twitter")} placeholder="Handle or URL" />
      </Field>
      <Field label="Instagram">
        <Input value={form.instagram} onChange={update("instagram")} placeholder="Handle" />
      </Field>
      <Field label="Website">
        <Input value={form.website} onChange={update("website")} placeholder="Website URL" />
      </Field>
    </>
  );

  const tagFields = (
    <>
      <Field label="Skills (comma-separated)" wide>
        <Input value={form.skills} onChange={update("skills")} placeholder="React, Python, Design" />
      </Field>
      <Field label="Sources (comma-separated)" wide>
        <Input
          value={form.source}
          onChange={update("source")}
          placeholder='e.g. "Maker Mondays #12, Toronto Tech Week"'
        />
      </Field>
    </>
  );

  const notesField = (
    <Field label="Notes" wide>
      <textarea
        value={form.notes}
        onChange={update("notes")}
        placeholder="Anything worth remembering about this person"
        rows={6}
        className={textareaClass}
      />
    </Field>
  );

  const errorBanner = error && (
    <div className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive">{error}</div>
  );

  // Adding a contact: one form card, Shopify's "Add customer" page.
  if (isNew) {
    return (
      <AdminPage width="narrow">
        <PageHeader title="Add contact" backHref="/admin/contacts" backLabel="Contacts" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-4"
        >
          {errorBanner}
          <AdminCard title="Contact">
            <div className="grid grid-cols-2 gap-3">{contactFields}</div>
          </AdminCard>
          <AdminCard title="Tags">
            <div className="grid grid-cols-2 gap-3">{tagFields}</div>
          </AdminCard>
          <AdminCard title="Notes">{notesField}</AdminCard>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="bg-card" onClick={() => router.push("/admin/contacts")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save contact"}
            </Button>
          </div>
        </form>
      </AdminPage>
    );
  }

  if (loading) {
    return (
      <AdminPage>
        <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
      </AdminPage>
    );
  }

  if (!contact) {
    return (
      <AdminPage>
        <PageHeader title="Contact not found" backHref="/admin/contacts" backLabel="Contacts" />
      </AdminPage>
    );
  }

  const intel = contact.metadata?.intel;
  const name = displayName(contact);
  const place = contact.location || [intel?.city, intel?.country].filter(Boolean).join(", ");
  const subtitle = [
    [contact.role, contact.company].filter(Boolean).join(" at "),
    place,
    contact.events?.length ? `${contact.events.length} event${contact.events.length === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  // Plain CSV columns from older imports; `intel` is an object with its own cards.
  const extra = Object.entries(contact.metadata ?? {}).filter(
    (e): e is [string, string] => typeof e[1] === "string",
  );
  const links = [
    contact.linkedin && { label: "LinkedIn", value: contact.linkedin, href: linkHref(contact.linkedin) },
    contact.twitter && { label: "X", value: contact.twitter, href: linkHref(contact.twitter, "https://x.com/") },
    contact.instagram && {
      label: "Instagram",
      value: contact.instagram,
      href: linkHref(contact.instagram, "https://instagram.com/"),
    },
    contact.website && { label: "Website", value: contact.website, href: linkHref(contact.website) },
  ].filter((l): l is { label: string; value: string; href: string } => !!l);

  return (
    <AdminPage>
      <PageHeader
        backHref="/admin/contacts"
        backLabel="Contacts"
        leading={<Initials name={name} size="lg" />}
        title={name}
        badges={
          <>
            {contact.matched_profile_id && <StatusPill tone="success">Member</StatusPill>}
            {contact.visibility === "public" && <StatusPill tone="info">Public</StatusPill>}
          </>
        }
        subtitle={subtitle.length ? subtitle.join(" · ") : contact.email}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-card">
                More actions <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={toggleVisibility}>
                {contact.visibility === "public" ? "Make private" : "Make public"}
              </DropdownMenuItem>
              {contact.visibility === "public" && (
                <DropdownMenuItem asChild>
                  <Link href={`/community/${contact.id}`}>View public card</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={remove}>
                Delete contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4 min-w-0">
          <IntelSummaryCard intel={intel} />
          <ProjectsCard intel={intel} />
          <EventHistoryCard events={contact.events} />
          {extra.length > 0 && (
            <AdminCard title="Imported data" id="contact-imported-data">
              <dl className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
                {extra.map(([key, value]) => (
                  <div key={key} className="min-w-0">
                    <dt className="text-xs capitalize text-muted-foreground">{key.replace(/[_-]/g, " ")}</dt>
                    <dd className="break-words text-[13px]">{value}</dd>
                  </div>
                ))}
              </dl>
            </AdminCard>
          )}
        </div>

        <div className="space-y-4 min-w-0">
          <AdminCard title="Contact" action={<CardAction onClick={() => openEdit("contact")}>Edit</CardAction>}>
            <div className="space-y-3 text-[13px]">
              <div>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="break-all text-primary hover:underline">
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">No email</span>
                )}
                {contact.phone && <div className="mt-0.5 text-foreground/80">{contact.phone}</div>}
              </div>
              {(contact.role || contact.company) && (
                <div>
                  <div className="text-xs text-muted-foreground">Work</div>
                  <div>{[contact.role, contact.company].filter(Boolean).join(" at ")}</div>
                </div>
              )}
              {place && (
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div>{place}</div>
                </div>
              )}
              {links.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground">Links</div>
                  <ul className="mt-0.5 space-y-0.5">
                    {links.map((l) => (
                      <li key={l.label} className="flex gap-2">
                        <span className="w-16 shrink-0 text-foreground/60">{l.label}</span>
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 truncate text-primary hover:underline"
                        >
                          {l.value.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard title="Tags" action={<CardAction onClick={() => openEdit("tags")}>Edit</CardAction>}>
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">Skills</div>
                {contact.skills?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {contact.skills.map((s) => (
                      <StatusPill key={s}>{s}</StatusPill>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-foreground/40">None</p>
                )}
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">Sources</div>
                {contact.source?.length ? (
                  <ul className="space-y-0.5 text-[13px]">
                    {contact.source.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-foreground/40">None</p>
                )}
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Notes" action={<CardAction onClick={() => openEdit("notes")}>Edit</CardAction>}>
            {contact.notes ? (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{contact.notes}</p>
            ) : (
              <p className="text-[13px] text-foreground/40">No notes</p>
            )}
          </AdminCard>

          <AdminCard title="Member profile">
            {matchedProfile ? (
              <div className="text-[13px]">
                <div className="font-medium">{matchedProfile.name || "Unnamed"}</div>
                {matchedProfile.username && (
                  <div className="text-muted-foreground">@{matchedProfile.username}</div>
                )}
                {matchedProfile.bio && <p className="mt-1.5 text-foreground/80">{matchedProfile.bio}</p>}
                <Link
                  href={`/profile/${matchedProfile.id}`}
                  className="mt-2 inline-block font-medium text-primary hover:underline"
                >
                  View profile
                </Link>
              </div>
            ) : (
              <p className="text-[13px] text-foreground/40">
                Not a member yet. They match automatically when they sign up with this email.
              </p>
            )}
          </AdminCard>
        </div>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? SECTION_TITLES[editing] : "Edit"}</DialogTitle>
          </DialogHeader>
          <form
            id="contact-edit-form"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-3"
          >
            {errorBanner}
            <div className="grid grid-cols-2 gap-3">
              {editing === "contact" && contactFields}
              {editing === "tags" && tagFields}
              {editing === "notes" && notesField}
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" className="bg-card" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="contact-edit-form" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
