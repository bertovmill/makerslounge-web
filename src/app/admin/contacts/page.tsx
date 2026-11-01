"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, Upload, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminPage, PageHeader, StatusPill, Initials } from "@/components/admin/AdminPage";
import { cn } from "@/lib/utils";
import type { CommunityContact } from "@/lib/contacts-client";
import {
  fetchContacts as fetchContactRows,
  deleteContacts,
  importContacts,
} from "@/lib/contacts-client";
import { useAuth } from "@/context/AuthContext";


// Shopify-style index tabs: saved views over the same list.
const TABS = [
  { key: "all", label: "All" },
  { key: "intel", label: "With intel" },
  { key: "members", label: "Members" },
  { key: "public", label: "Public" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const TAB_FILTERS: Record<TabKey, (c: CommunityContact) => boolean> = {
  all: () => true,
  intel: (c) => !!c.metadata?.intel?.structured,
  members: (c) => !!c.matched_profile_id,
  public: (c) => c.visibility === "public",
};

const shortDate = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Toronto",
});

// `useSearchParams` needs a Suspense boundary or the build bails out of
// prerendering the page.
export default function ContactsPage() {
  return (
    <Suspense>
      <ContactsIndex />
    </Suspense>
  );
}

function ContactsIndex() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  // The admin top bar searches by landing here with `?q=`.
  const urlQuery = params.get("q") ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<File[]>([]);
  const [contacts, setContacts] = useState<CommunityContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(urlQuery);
  const [tab, setTab] = useState<TabKey>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSource, setImportSource] = useState("");

  // Column filters
  const [filterSource, setFilterSource] = useState("");
  const [filterCompany, setFilterCompany] = useState("");

  // A new top-bar search replaces whatever was typed here.
  useEffect(() => {
    setSearch(urlQuery);
    setDebouncedSearch(urlQuery);
  }, [urlQuery]);

  // Search runs on the server, so wait for a pause in typing.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchContacts = useCallback(async () => {
    try {
      // Search is a query parameter now rather than a PostgREST filter string built
      // by interpolation. The old expression also matched `source` as an array
      // containment check, which the route does not — searching by source list is a
      // filter the UI already offers separately.
      const data = await fetchContactRows({ q: debouncedSearch.trim() || undefined });
      setContacts(data);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchContacts();
  }, [isAdmin, fetchContacts]);

  // Clear selection when contacts change
  useEffect(() => {
    setSelected(new Set());
  }, [contacts]);

  // Unique sources and companies for filter dropdowns
  const sources = useMemo(
    () => [...new Set(contacts.flatMap((c) => c.source || []))].sort(),
    [contacts]
  );
  const companies = useMemo(
    () => [...new Set(contacts.map((c) => c.company).filter(Boolean))].sort() as string[],
    [contacts]
  );

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(TABS.map((t) => [t.key, contacts.filter(TAB_FILTERS[t.key]).length])) as Record<
        TabKey,
        number
      >,
    [contacts],
  );

  // Filtered contacts
  const filtered = useMemo(() => {
    let result = contacts.filter(TAB_FILTERS[tab]);
    if (filterSource) result = result.filter((c) => c.source?.includes(filterSource));
    if (filterCompany) result = result.filter((c) => c.company === filterCompany);
    return result;
  }, [contacts, tab, filterSource, filterCompany]);

  // Selection is per view: switching tab or filter clears it.
  useEffect(() => {
    setSelected(new Set());
  }, [tab, filterSource, filterCompany]);

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected contact${selected.size > 1 ? "s" : ""}?`)) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selected);
      if (!(await deleteContacts(ids))) throw new Error("bulk delete failed");
      setContacts((prev) => prev.filter((c) => !selected.has(c.id)));
      setSelected(new Set());
    } catch (err) {
      console.error("Bulk delete error:", err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const cleanFileName = (name: string) =>
    name
      .replace(/\.csv$/i, "")
      .replace(/\s*-\s*\d{4}-\d{2}-\d{2}[-\d]*$/, "") // strip date suffixes like "- 2026-03-27-17-37-04"
      .replace(/\s*-\s*Guests$/i, "") // strip "- Guests"
      .trim();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    pendingFilesRef.current = Array.from(files);
    const names = Array.from(files).map((f) => cleanFileName(f.name)).filter(Boolean);
    setImportSource([...new Set(names)].join(", "));
    setShowImportModal(true);
    e.target.value = "";
  };

  const parseCsvFile = async (file: File, sources: string[]) => {
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

    const rows = lines.slice(1).map((line) => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });

    return rows
      .map((values) => {
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || "";
        });

        const email = row["email"] || row["email address"] || "";
        if (!email) return null;

        const contact: Record<string, unknown> = { email };

        const fieldMap: [string, string[]][] = [
          ["first_name", ["first name", "first_name", "firstname"]],
          ["last_name", ["last name", "last_name", "lastname"]],
          ["name", ["name", "full name"]],
          ["company", ["company", "organization"]],
          ["role", ["role", "title", "job title", "ticket_name", "ticket name"]],
          ["source", ["source", "event", "custom_source"]],
          ["phone", ["phone", "phone_number", "phone number", "mobile", "tel"]],
          ["linkedin", ["linkedin", "linkedin url", "linkedin_url"]],
          ["twitter", ["twitter", "x", "x_url", "twitter_url"]],
          ["instagram", ["instagram", "instagram_url"]],
          ["website", ["website", "url"]],
          ["notes", ["notes", "survey_response_feedback"]],
        ];

        // Headers to always skip (not useful as metadata)
        const skipHeaders = new Set([
          "api_id", "qr_code_url", "amount", "amount_tax",
          "amount_discount", "currency", "coupon_code",
          "eth_address", "solana_address", "created_at",
          "approval_status", "checked_in_at", "ticket_type_id",
          "survey_response_rating",
        ]);

        // Fuzzy keyword matching for registration questions
        // e.g. "What's your LinkedIn?" → linkedin, "Company Name" → company
        const fuzzyMap: [string, string[]][] = [
          ["company", ["company", "organization", "startup", "where do you work"]],
          ["role", ["role", "title", "job", "position", "what do you do"]],
          ["linkedin", ["linkedin"]],
          ["twitter", ["twitter", "x.com"]],
          ["instagram", ["instagram"]],
          ["website", ["website", "portfolio", "personal site"]],
          ["phone", ["phone", "mobile", "cell"]],
          ["skills", ["skill", "expertise", "tech stack", "what are you building", "what do you build"]],
          ["notes", ["about", "bio", "tell us", "anything else", "comment", "feedback"]],
        ];

        const mappedHeaders = new Set<string>(["email", "email address"]);
        // Exact alias matching first
        for (const [field, aliases] of fieldMap) {
          const match = aliases.find((a) => headers.includes(a));
          if (match) {
            contact[field] = row[match] || null;
            aliases.forEach((a) => mappedHeaders.add(a));
          }
        }
        // Fuzzy matching for remaining headers (registration questions)
        for (const h of headers) {
          if (mappedHeaders.has(h) || skipHeaders.has(h) || !row[h]) continue;
          const lower = h.toLowerCase();
          for (const [field, keywords] of fuzzyMap) {
            if (contact[field]) break; // already mapped
            if (keywords.some((k) => lower.includes(k))) {
              if (field === "skills") {
                // Append to skills array
                const existing = (contact.skills as string[] | undefined) || [];
                contact.skills = [...existing, row[h]];
              } else if (field === "notes" && contact.notes) {
                contact.notes = `${contact.notes}\n${h}: ${row[h]}`;
              } else {
                contact[field] = row[h];
              }
              mappedHeaders.add(h);
              break;
            }
          }
        }

        const csvSource = contact.source as string | null;
        delete contact.source;
        const rowSources: string[] = [];
        if (csvSource) rowSources.push(csvSource);
        for (const s of sources) {
          if (!rowSources.includes(s)) rowSources.push(s);
        }
        contact._sources = rowSources;

        const metadata: Record<string, string> = {};
        for (const h of headers) {
          if (!mappedHeaders.has(h) && !skipHeaders.has(h) && row[h]) {
            metadata[h] = row[h];
          }
        }
        if (Object.keys(metadata).length > 0) {
          contact.metadata = metadata;
        }

        return contact;
      })
      .filter(Boolean) as Record<string, unknown>[];
  };

  const handleImportConfirm = async () => {
    const files = pendingFilesRef.current;
    if (files.length === 0) return;
    setShowImportModal(false);
    setImporting(true);

    const sources = importSource.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      // Parse all CSV files and merge by email
      const allParsed = new Map<string, Record<string, unknown>>();
      for (const file of files) {
        const rows = await parseCsvFile(file, sources);
        for (const row of rows) {
          const email = (row.email as string).toLowerCase();
          const existing = allParsed.get(email);
          if (existing) {
            // Merge: keep non-null fields, combine sources
            const existingSources = (existing._sources as string[]) || [];
            const newSources = (row._sources as string[]) || [];
            const merged = [...new Set([...existingSources, ...newSources])];
            // Overwrite with non-null values from later file
            for (const [k, v] of Object.entries(row)) {
              if (v != null && k !== "_sources") existing[k] = v;
            }
            existing._sources = merged;
          } else {
            allParsed.set(email, { ...row, email });
          }
        }
      }

      const parsedContacts = Array.from(allParsed.values());
      if (parsedContacts.length === 0) {
        setImporting(false);
        return;
      }

      // Fetch existing contacts in batches to merge sources
      // The route upserts on email and unions the `source` arrays in SQL. This used
      // to pre-fetch each batch's existing sources and merge them in JS, which meant
      // a read per batch and a lost update if two imports overlapped.
      const contacts = parsedContacts.map((c) => {
        const { _sources, ...rest } = c;
        const sources = (_sources as string[]) || [];
        return { ...rest, source: sources.length > 0 ? sources : null };
      });

      const result = await importContacts(contacts);
      if (!result.success) throw new Error(result.error ?? "import failed");

      fetchContacts();
    } catch (err) {
      console.error("CSV import error:", err);
    } finally {
      pendingFilesRef.current = [];
      setImporting(false);
    }
  };

  const total = contacts.length;

  const displayName = (c: CommunityContact) =>
    c.name || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Unnamed";

  const hasActiveFilters = filterSource || filterCompany;
  const allSelected = selected.size === filtered.length && filtered.length > 0;

  const handleDeleteAll = async () => {
    if (!confirm(`Delete ALL ${contacts.length} contacts? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      // Still batched: the ids go in the query string, and 822 uuids would
      // make for an unreasonable URL.
      const ids = contacts.map((c) => c.id);
      for (let i = 0; i < ids.length; i += 50) {
        await deleteContacts(ids.slice(i, i + 50));
      }
      setContacts([]);
      setSelected(new Set());
    } catch (err) {
      console.error("Delete all error:", err);
    } finally {
      setBulkDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Access denied
      </div>
    );
  }

  const selectClass =
    "h-8 rounded-lg border border-[var(--frame-edge)] bg-card px-2.5 text-[13px] text-foreground/80 hover:bg-foreground/[0.03] focus:outline-none focus:ring-2 focus:ring-primary/15";

  return (
    <AdminPage width="wide">
      <PageHeader
        title="Contacts"
        subtitle={`${total.toLocaleString()} people from event guest lists and imports. They match to a member when that person signs up.`}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-card">
                  More actions <ChevronDown className="opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  disabled={contacts.length === 0 || bulkDeleting}
                  onSelect={handleDeleteAll}
                >
                  {bulkDeleting ? "Deleting…" : "Delete all contacts"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="bg-card"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload /> {importing ? "Importing…" : "Import"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={importing}
            />
            <Button size="sm" onClick={() => router.push("/admin/contacts/new")}>
              <Plus /> Add contact
            </Button>
          </>
        }
      />

      <section
        id="contacts-table"
        className="overflow-hidden rounded-xl border border-[var(--frame-edge)] bg-card shadow-[var(--shadow-card)]"
      >
        {/* Views */}
        <div className="flex items-center gap-1 overflow-x-auto px-2 pt-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-medium transition-colors",
                tab === t.key
                  ? "bg-foreground/[0.07] text-foreground"
                  : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground",
              )}
            >
              {t.label}
              <span className="tabular-nums text-foreground/45">{tabCounts[t.key].toLocaleString()}</span>
            </button>
          ))}
        </div>

        {/* Search + filters, or bulk actions while rows are selected */}
        <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-[var(--frame-edge)] px-3 py-2">
          {selected.size > 0 ? (
            <>
              <span className="text-[13px] font-medium">{selected.size} selected</span>
              <Button
                variant="outline"
                size="sm"
                className="bg-card text-destructive hover:text-destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? "Deleting…" : "Delete"}
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-[13px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </>
          ) : (
            <>
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, company or location"
                  aria-label="Search contacts"
                  className="h-8 w-full rounded-lg border border-[var(--frame-edge)] bg-card pl-8 pr-3 text-[13px] outline-none placeholder:text-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className={cn(selectClass, "max-w-[200px]")}
                aria-label="Filter by source"
              >
                <option value="">Any source</option>
                {sources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className={cn(selectClass, "max-w-[180px]")}
                aria-label="Filter by company"
              >
                <option value="">Any company</option>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterSource(""); setFilterCompany(""); }}
                  className="flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" /> Clear filters
                </button>
              )}
            </>
          )}
        </div>

        {loading && contacts.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading contacts…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium">No contacts found</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {search || hasActiveFilters || tab !== "all"
                ? "Try changing the search, filters or view."
                : "Import a guest list or add someone by hand."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--frame-edge)] bg-foreground/[0.025] text-left text-xs font-medium text-foreground/60">
                  <th className="w-10 py-2 pl-4 pr-1">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded accent-primary align-middle"
                    />
                  </th>
                  <th className="py-2 px-3 font-medium">Contact</th>
                  <th className="py-2 px-3 font-medium">Location</th>
                  <th className="py-2 px-3 font-medium">Tags</th>
                  <th className="py-2 px-3 font-medium">Source</th>
                  <th className="py-2 px-3 font-medium whitespace-nowrap">Last event</th>
                  <th className="py-2 px-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => {
                  const intel = contact.metadata?.intel;
                  const tags = intel?.structured?.roles?.length
                    ? intel.structured.roles
                    : contact.skills ?? [];
                  const place = intel?.city || contact.location;
                  const role = [contact.role, contact.company].filter(Boolean).join(" · ");
                  return (
                    <tr
                      key={contact.id}
                      onClick={() => router.push(`/admin/contacts/${contact.id}`)}
                      className={cn(
                        "cursor-pointer border-b border-[var(--frame-edge)] last:border-0 hover:bg-foreground/[0.025]",
                        selected.has(contact.id) && "bg-primary/[0.04]",
                      )}
                    >
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${displayName(contact)}`}
                          checked={selected.has(contact.id)}
                          onChange={() => toggleSelect(contact.id)}
                          className="h-3.5 w-3.5 rounded accent-primary align-middle"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex w-[280px] items-center gap-2.5">
                          <Initials name={displayName(contact)} />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">{displayName(contact)}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {role || contact.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-foreground/75">
                        {place ? (
                          <span className="block max-w-[160px] truncate" title={place}>{place}</span>
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {tags.length ? (
                          <div className="flex max-w-[240px] flex-wrap gap-1">
                            {tags.slice(0, 2).map((t) => (
                              <StatusPill key={t}>{t}</StatusPill>
                            ))}
                            {tags.length > 2 && (
                              <span className="px-0.5 text-xs text-muted-foreground">+{tags.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-foreground/75">
                        {contact.source?.length ? (
                          <span className="block max-w-[180px] truncate" title={contact.source.join(", ")}>
                            {contact.source[0]}
                            {contact.source.length > 1 && (
                              <span className="text-muted-foreground"> +{contact.source.length - 1}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap tabular-nums text-foreground/75">
                        {intel?.last_event_at ? (
                          shortDate.format(new Date(intel.last_event_at))
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 pr-4">
                        <div className="flex gap-1">
                          {contact.matched_profile_id && <StatusPill tone="success">Member</StatusPill>}
                          {contact.visibility === "public" && <StatusPill tone="info">Public</StatusPill>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="border-t border-[var(--frame-edge)] px-4 py-2.5 text-xs text-muted-foreground">
            Showing {filtered.length.toLocaleString()} of {total.toLocaleString()}
          </div>
        )}
      </section>

      {/* Import Source Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">
              Import {pendingFilesRef.current.length} CSV{pendingFilesRef.current.length > 1 ? " files" : ""}
            </h3>
            {pendingFilesRef.current.length > 1 && (
              <div className="mb-3 text-xs text-muted-foreground space-y-0.5">
                {pendingFilesRef.current.map((f, i) => (
                  <p key={i}>{f.name}</p>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              What event or source {pendingFilesRef.current.length > 1 ? "are these CSVs" : "is this CSV"} from? This will be applied as the source for all contacts that don&apos;t already have one.
            </p>
            <Input
              value={importSource}
              onChange={(e) => setImportSource(e.target.value)}
              placeholder='e.g. "Maker Mondays #14", "Toronto Tech Week"'
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleImportConfirm();
              }}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportModal(false);
                  pendingFilesRef.current = [];
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleImportConfirm}>
                {importSource.trim() ? "Import" : "Import without source"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminPage>
  );
}
