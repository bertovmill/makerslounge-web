"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CommunityContact } from "@/lib/contacts-client";
import {
  fetchContacts as fetchContactRows,
  deleteContact,
  deleteContacts,
  updateContact,
  importContacts,
} from "@/lib/contacts-client";
import { useAuth } from "@/context/AuthContext";


export default function ContactsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<File[]>([]);
  const [contacts, setContacts] = useState<CommunityContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSource, setImportSource] = useState("");

  // Column filters
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "matched" | "unmatched">("");
  const [filterCompany, setFilterCompany] = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      // Search is a query parameter now rather than a PostgREST filter string built
      // by interpolation. The old expression also matched `source` as an array
      // containment check, which the route does not — searching by source list is a
      // filter the UI already offers separately.
      const data = await fetchContactRows({ q: search.trim() || undefined });
      setContacts(data);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
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

  // Filtered contacts
  const filtered = useMemo(() => {
    let result = contacts;
    if (filterSource) result = result.filter((c) => c.source?.includes(filterSource));
    if (filterCompany) result = result.filter((c) => c.company === filterCompany);
    if (filterStatus === "matched") result = result.filter((c) => c.matched_profile_id);
    if (filterStatus === "unmatched") result = result.filter((c) => !c.matched_profile_id);
    return result;
  }, [contacts, filterSource, filterCompany, filterStatus]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    setDeleting(id);
    try {
      if (!(await deleteContact(id))) throw new Error("delete failed");
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting contact:", err);
    } finally {
      setDeleting(null);
    }
  };

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
    c.name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";

  // Dynamic columns: detect which fields have data
  const optionalFields = useMemo<{ key: string; label: string }[]>(() => [
    { key: "company", label: "Company" },
    { key: "role", label: "Role" },
    { key: "phone", label: "Phone" },
    { key: "source", label: "Source" },
    { key: "skills", label: "Skills" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "twitter", label: "Twitter" },
    { key: "instagram", label: "Instagram" },
    { key: "website", label: "Website" },
    { key: "notes", label: "Notes" },
  ], []);

  // Also gather metadata keys across all contacts
  const metadataKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const c of filtered) {
      if (c.metadata) {
        for (const k of Object.keys(c.metadata)) keys.add(k);
      }
    }
    return [...keys].sort();
  }, [filtered]);

  // Only show columns where at least one contact has data
  const activeColumns = useMemo(() => {
    return optionalFields.filter((col) => {
      if (col.key === "source") return filtered.some((c) => c.source?.length);
      if (col.key === "skills") return filtered.some((c) => c.skills?.length);
      return filtered.some((c) => {
        const val = c[col.key as keyof CommunityContact];
        return val != null && val !== "";
      });
    });
  }, [filtered, optionalFields]);

  const hasActiveFilters = filterSource || filterCompany || filterStatus;

  const renderCell = (contact: CommunityContact, key: string): React.ReactNode => {
    switch (key) {
      case "source":
        return contact.source?.length ? (
          <div className="flex gap-1 flex-wrap">
            {contact.source.map((s) => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
          </div>
        ) : null;
      case "skills":
        return contact.skills?.length ? (
          <div className="flex gap-1 flex-wrap">
            {contact.skills.slice(0, 3).map((s) => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
            {contact.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">+{contact.skills.length - 3}</Badge>
            )}
          </div>
        ) : null;
      case "linkedin":
      case "website":
        const val = contact[key as keyof CommunityContact] as string | null;
        return val ? <span className="truncate max-w-[150px] block">{val}</span> : null;
      case "notes":
        return contact.notes ? <span className="truncate max-w-[200px] block">{contact.notes}</span> : null;
      default:
        return (contact[key as keyof CommunityContact] as string | null) || null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Access denied
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Badge variant="secondary" className="mb-4">
            Admin
          </Badge>
          <h1 className="text-4xl font-bold mb-2">Community Contacts</h1>
          <p className="text-muted-foreground">
            Pre-loaded attendee data from events — auto-matches on signup
          </p>
        </div>
        <Card className="px-6 py-4 text-center">
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-sm text-muted-foreground">Total Contacts</p>
        </Card>
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search by name, email, company, source..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={() => router.push("/admin/contacts/new")}>
          + Add Contact
        </Button>
        {contacts.length > 0 && (
          <Button
            variant="destructive"
            onClick={async () => {
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
            }}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? "Deleting..." : "Delete All"}
          </Button>
        )}
        <label>
          <Button variant="outline" asChild disabled={importing}>
            <span>{importing ? "Importing..." : "Import CSV"}</span>
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
        </label>
      </div>

      {/* Column Filters */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-muted-foreground">Filters:</span>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-md border border-input bg-background"
        >
          <option value="">All Sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-md border border-input bg-background"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "" | "matched" | "unmatched")}
          className="px-3 py-1.5 text-sm rounded-md border border-input bg-background"
        >
          <option value="">All Status</option>
          <option value="matched">Matched</option>
          <option value="unmatched">Unmatched</option>
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => { setFilterSource(""); setFilterCompany(""); setFilterStatus(""); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </button>
        )}
        {hasActiveFilters && (
          <span className="text-xs text-muted-foreground">
            Showing {filtered.length} of {contacts.length}
          </span>
        )}
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? "Deleting..." : `Delete ${selected.size}`}
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading contacts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search || hasActiveFilters ? "No contacts match your filters" : "No contacts yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  {activeColumns.map((col) => (
                    <th key={col.key} className="text-left py-3 px-4 font-semibold">{col.label}</th>
                  ))}
                  {metadataKeys.map((key) => (
                    <th key={`meta-${key}`} className="text-left py-3 px-4 font-semibold capitalize">
                      {key.replace(/[_-]/g, " ")}
                    </th>
                  ))}
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`border-b border-border/50 hover:bg-muted/30 ${selected.has(contact.id) ? "bg-muted/20" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.has(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm font-medium whitespace-nowrap">
                      <Link href={`/community/${contact.id}`} className="hover:underline">
                        {displayName(contact)}
                      </Link>
                      {contact.visibility === "public" && (
                        <Badge variant="default" className="ml-2 text-[10px] py-0">Public</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {contact.email}
                    </td>
                    {activeColumns.map((col) => (
                      <td key={col.key} className="py-3 px-4 text-sm">
                        {renderCell(contact, col.key) || <span className="text-muted-foreground">—</span>}
                      </td>
                    ))}
                    {metadataKeys.map((key) => (
                      <td key={`meta-${key}`} className="py-3 px-4 text-sm">
                        <span className="truncate max-w-[200px] block">
                          {contact.metadata?.[key] || <span className="text-muted-foreground">—</span>}
                        </span>
                      </td>
                    ))}
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const newVis = contact.visibility === "public" ? "private" : "public";
                            await updateContact(contact.id, { visibility: newVis });
                            setContacts((prev) =>
                              prev.map((c) =>
                                c.id === contact.id ? { ...c, visibility: newVis } : c
                              )
                            );
                          }}
                          className={contact.visibility === "public" ? "text-green-600" : ""}
                        >
                          {contact.visibility === "public" ? "Public" : "Private"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/contacts/${contact.id}`)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(contact.id)}
                          disabled={deleting === contact.id}
                        >
                          {deleting === contact.id ? "..." : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
    </div>
  );
}
