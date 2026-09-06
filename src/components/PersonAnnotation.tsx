"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Tag, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveAnnotation, type ProfileAnnotation } from "@/lib/profile-annotations-client";
import {
  MAX_NOTE_LENGTH,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  normalizeTags,
  tagsMatch,
} from "@/lib/profile-annotations";

/**
 * Editor for the private tags + note the signed-in member keeps about one other
 * member. Rendered as a small dialog so it works identically on a /people card and
 * on the profile page, and on a phone.
 *
 * The parent owns the saved annotation (so a list page can update one card without
 * refetching everything); this component owns only the draft.
 */

interface PersonAnnotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  personName: string;
  annotation: ProfileAnnotation | null;
  /** Tags the viewer has used on anyone, offered as one-click suggestions. */
  suggestedTags?: string[];
  onSaved: (annotation: ProfileAnnotation | null) => void;
}

export function PersonAnnotationDialog({
  open,
  onOpenChange,
  ...formProps
}: PersonAnnotationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        // The trigger lives inside a <Link> on /people; don't let the click bubble
        // up and navigate.
        onClick={(e) => e.stopPropagation()}
      >
        {/* Radix unmounts the content when closed, so the form's draft state is
            re-initialised from the saved annotation on every open. */}
        <AnnotationForm {...formProps} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AnnotationForm({
  profileId,
  personName,
  annotation,
  suggestedTags = [],
  onSaved,
  onClose,
}: Omit<PersonAnnotationDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [tags, setTags] = useState<string[]>(annotation?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [note, setNote] = useState(annotation?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    return suggestedTags
      .filter((t) => !tags.some((mine) => tagsMatch(mine, t)))
      .filter((t) => !q || t.toLowerCase().includes(q))
      .slice(0, 8);
  }, [suggestedTags, tags, tagInput]);

  function addTag(raw: string) {
    const next = normalizeTags([...tags, raw]);
    setTags(next);
    setTagInput("");
    tagInputRef.current?.focus();
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => !tagsMatch(t, tag)));
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    // A tag typed but not yet committed still counts.
    const finalTags = tagInput.trim() ? normalizeTags([...tags, tagInput]) : tags;
    const result = await saveAnnotation({ profileId, tags: finalTags, note });
    setSaving(false);
    if (!result.success) {
      setError("Couldn't save. Try again.");
      return;
    }
    onSaved(result.data ?? null);
    onClose();
  }

  const hasSaved = !!annotation && (annotation.tags.length > 0 || !!annotation.note);

  return (
    <>
        <DialogHeader>
          <DialogTitle className="text-base">Tags &amp; note for {personName}</DialogTitle>
          <DialogDescription className="text-xs">
            Only you can see these. Use them to remember who&apos;s who and filter People.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tags */}
          <div>
            <label htmlFor="annotation-tags" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Tags
            </label>
            <div
              className="flex flex-wrap items-center gap-1.5 min-h-10 px-2.5 py-1.5 rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors cursor-text"
              onClick={() => tagInputRef.current?.focus()}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-foreground text-background text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove tag ${tag}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                    className="rounded-full p-0.5 hover:bg-background/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                id="annotation-tags"
                ref={tagInputRef}
                type="text"
                value={tagInput}
                maxLength={MAX_TAG_LENGTH}
                disabled={tags.length >= MAX_TAGS}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKeyDown}
                onBlur={() => tagInput.trim() && addTag(tagInput)}
                placeholder={tags.length ? "" : "e.g. met at meetup 12, cofounder, follow up"}
                className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Press Enter or comma to add a tag.
            </p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2.5 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label htmlFor="annotation-note" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Note
            </label>
            <textarea
              id="annotation-note"
              rows={4}
              maxLength={MAX_NOTE_LENGTH}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth remembering about them"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            {hasSaved && (
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setTags([]);
                  setNote("");
                  setTagInput("");
                  setSaving(true);
                  const result = await saveAnnotation({ profileId, tags: [], note: null });
                  setSaving(false);
                  if (!result.success) {
                    setError("Couldn't clear. Try again.");
                    return;
                  }
                  onSaved(null);
                  onClose();
                }}
                className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
    </>
  );
}

/**
 * The small "tag" control: shows how many tags are set and opens the editor.
 * Stops propagation so it can sit inside a card that is itself a link.
 */
export function PersonAnnotationButton({
  annotation,
  onClick,
  className = "",
}: {
  annotation: ProfileAnnotation | null;
  onClick: () => void;
  className?: string;
}) {
  const count = annotation?.tags.length ?? 0;
  const hasNote = !!annotation?.note;
  const active = count > 0 || hasNote;
  return (
    <button
      type="button"
      aria-label={active ? "Edit your tags and note" : "Add a tag or note"}
      title={active ? "Edit your tags and note" : "Add a tag or note"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-xs transition-colors ${
        active
          ? "text-foreground hover:bg-secondary"
          : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary"
      } ${className}`}
    >
      <Tag className="w-3.5 h-3.5" />
      {count > 0 && <span className="font-medium">{count}</span>}
    </button>
  );
}
