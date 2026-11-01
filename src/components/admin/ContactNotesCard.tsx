"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminCard, CardAction, StatusPill } from "@/components/admin/AdminPage";
import { fetchContactNotes, saveContactNote } from "@/lib/contacts-client";
import { NOTE_CHANNELS, compareNotes, todayInToronto, type ContactNote } from "@/lib/contact-notes";
import { cn } from "@/lib/utils";

/** `happened_on` is a bare date: format it as one, so no zone can shift the day. */
const dayFmt = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const formatDay = (d: string) => dayFmt.format(new Date(`${d}T00:00:00Z`));

type Draft = { happened_on: string; channel: string; body: string };

/**
 * Notes from Berto's conversations with this person (table `contact_notes`),
 * newest first, Shopify's customer timeline. Cael can add to it through the same
 * API, so a note logged from a chat shows up here.
 */
export function ContactNotesCard({ contactId }: { contactId: string }) {
  const [notes, setNotes] = useState<ContactNote[] | null>(null);
  const [editing, setEditing] = useState<ContactNote | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>({ happened_on: "", channel: "", body: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContactNotes(contactId).then(setNotes);
  }, [contactId]);

  const open = (note: ContactNote | "new") => {
    setDraft(
      note === "new"
        ? { happened_on: todayInToronto(), channel: "", body: "" }
        : { happened_on: note.happened_on, channel: note.channel ?? "", body: note.body },
    );
    setError(null);
    setEditing(note);
  };

  const save = async () => {
    if (!draft.body.trim()) {
      setError("Write what you talked about");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await saveContactNote(contactId, editing === "new" || !editing ? null : editing.id, {
      happened_on: draft.happened_on,
      channel: draft.channel,
      body: draft.body,
    });
    setSaving(false);
    if (!result.success || !result.data) {
      setError(result.error ?? "Save failed");
      return;
    }
    const saved = result.data;
    setNotes((prev) => [...(prev ?? []).filter((n) => n.id !== saved.id), saved].sort(compareNotes));
    setEditing(null);
  };

  const remove = async (note: ContactNote) => {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    const result = await saveContactNote(contactId, note.id, null);
    if (result.success) setNotes((prev) => (prev ?? []).filter((n) => n.id !== note.id));
  };

  return (
    <AdminCard
      id="contact-conversations"
      title="Conversations"
      action={<CardAction onClick={() => open("new")}>Add note</CardAction>}
    >
      {notes === null ? (
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[13px] text-foreground/40">
            No conversations logged yet. Add one after a coffee, a call or a chat at an event.
          </p>
          <Button size="sm" variant="outline" className="bg-card" onClick={() => open("new")}>
            Add note
          </Button>
        </div>
      ) : (
        <ol className="relative">
          {notes.map((note, i) => (
            <li key={note.id} className="group relative flex gap-3 pb-4 last:pb-0">
              {/* The rail: a dot per note, joined by a line down to the next. */}
              <div className="relative flex w-3 shrink-0 justify-center">
                <span className="mt-[5px] size-2 rounded-full bg-primary/70 ring-4 ring-card" />
                {i < notes.length - 1 && (
                  <span className="absolute top-3 -bottom-4 w-px bg-[var(--frame-edge)]" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium tabular-nums">{formatDay(note.happened_on)}</span>
                  {note.channel && <StatusPill>{note.channel}</StatusPill>}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Note actions"
                        className="ml-auto rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/[0.06] group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => open(note)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => remove(note)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground/85">
                  {note.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add note" : "Edit note"}</DialogTitle>
          </DialogHeader>
          <form
            id="contact-note-form"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-3"
          >
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive">{error}</div>
            )}
            <div className="grid grid-cols-[10rem_minmax(0,1fr)] gap-3">
              <label className="block">
                <span className="mb-1 block text-[13px] font-medium">Date</span>
                <Input
                  type="date"
                  value={draft.happened_on}
                  max={todayInToronto()}
                  onChange={(e) => setDraft({ ...draft, happened_on: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-medium">Where (optional)</span>
                <Input
                  value={draft.channel}
                  maxLength={100}
                  onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
                  placeholder="Coffee, LinkedIn, Maker Mondays #12…"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_CHANNELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraft({ ...draft, channel: draft.channel === c ? "" : c })}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                    draft.channel === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-[var(--frame-edge)] text-foreground/70 hover:bg-foreground/[0.04]",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium">Notes</span>
              <textarea
                autoFocus
                value={draft.body}
                maxLength={10000}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    save();
                  }
                }}
                placeholder="What you talked about, what they're building, what they need, any follow-up"
                rows={7}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </form>
          <DialogFooter>
            <Button variant="outline" className="bg-card" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="contact-note-form" disabled={saving}>
              {saving ? "Saving…" : "Save note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminCard>
  );
}
