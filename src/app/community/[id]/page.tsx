"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchContact,
  updateContact,
  type CommunityContact,
} from "@/lib/contacts-client";
import { useAuth } from "@/context/AuthContext";
import { Linkedin, Globe, Pencil, X, Check } from "lucide-react";


export default function CommunityProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const { isAdmin } = useAuth();

  const [contact, setContact] = useState<CommunityContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "", last_name: "", name: "",
    company: "", role: "", phone: "",
    linkedin: "", twitter: "", instagram: "", website: "",
    summary: "", skills: "", source: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      // The route already restricts non-admins to `visibility = 'public'`, so a
      // private contact simply is not returned. The client-side check below is kept
      // as a belt-and-braces guard, but it is no longer the thing enforcing it — it
      // used to be, with RLS behind it.
      const data = await fetchContact(id);

      if (!data) {
        setNotFound(true);
      } else if (data.visibility === "private" && !isAdmin) {
        setNotFound(true);
      } else {
        setContact(data);
        setEditForm({
          first_name: data.first_name || "", last_name: data.last_name || "", name: data.name || "",
          company: data.company || "", role: data.role || "", phone: data.phone || "",
          linkedin: data.linkedin || "", twitter: data.twitter || "", instagram: data.instagram || "", website: data.website || "",
          summary: data.summary || "", skills: (data.skills || []).join(", "), source: (data.source || []).join(", "), notes: data.notes || "",
        });
      }
      setLoading(false);
    };
    load();
  }, [id, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !contact) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-1">Profile not found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This profile doesn&apos;t exist or is private.
          </p>
          <Link href="/people" className="text-sm font-medium hover:underline">
            Browse people
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    contact.name ||
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Community Member";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Collect registration answers from metadata for display
  const interestingMeta = contact.metadata
    ? Object.entries(contact.metadata).filter(
        ([k]) =>
          !["ticket_name", "ticket_type", "referral_source", "how did you hear about the event?"].includes(
            k.toLowerCase()
          )
      )
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <Link
        href="/people"
        className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
      >
        &larr; Back to People
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {contact.visibility === "private" && isAdmin && (
              <Badge variant="secondary" className="text-xs">Private</Badge>
            )}
          </div>
          {contact.company || contact.role ? (
            <p className="text-muted-foreground">
              {[contact.role, contact.company].filter(Boolean).join(" at ")}
            </p>
          ) : null}

          {/* Social links */}
          <div className="flex items-center gap-3 mt-3">
            {contact.linkedin && (
              <a
                href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {contact.website && (
              <a
                href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Summary / Bio */}
      {contact.summary && (
        <Card className="p-5 mb-6">
          <p className="text-sm leading-relaxed">{contact.summary}</p>
        </Card>
      )}

      {/* Skills */}
      {contact.skills && contact.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {contact.skills.map((skill) => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Events attended */}
      {contact.source && contact.source.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Events Attended</h2>
          <div className="flex flex-wrap gap-2">
            {contact.source.map((event) => (
              <Badge key={event} variant="secondary">{event}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Registration answers (interesting metadata) */}
      {interestingMeta.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">About</h2>
          <div className="space-y-3">
            {interestingMeta.map(([question, answer]) => (
              <div key={question}>
                <p className="text-xs text-muted-foreground capitalize mb-1">
                  {question.replace(/[_-]/g, " ")}
                </p>
                <p className="text-sm">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="border-t border-border pt-6 mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const newVisibility = contact.visibility === "public" ? "private" : "public";
                await updateContact(contact.id, { visibility: newVisibility });
                setContact({ ...contact, visibility: newVisibility });
              }}
            >
              {contact.visibility === "public" ? "Make Private" : "Make Public"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!editing) {
                  setEditForm({
                    first_name: contact.first_name || "", last_name: contact.last_name || "", name: contact.name || "",
                    company: contact.company || "", role: contact.role || "", phone: contact.phone || "",
                    linkedin: contact.linkedin || "", twitter: contact.twitter || "", instagram: contact.instagram || "", website: contact.website || "",
                    summary: contact.summary || "", skills: (contact.skills || []).join(", "), source: (contact.source || []).join(", "), notes: contact.notes || "",
                  });
                }
                setEditing(!editing);
              }}
            >
              {editing ? <X className="w-4 h-4 mr-1" /> : <Pencil className="w-4 h-4 mr-1" />}
              {editing ? "Cancel" : "Quick Edit"}
            </Button>
            <Link href={`/admin/contacts/${contact.id}`}>
              <Button variant="ghost" size="sm">Full Edit</Button>
            </Link>
            {contact.email && (
              <span className="text-xs text-muted-foreground ml-auto">
                {contact.email}
              </span>
            )}
          </div>

          {editing && (
            <Card className="p-4 space-y-5 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Admin — Quick Edit</p>
                {contact.updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(contact.updated_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Name</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">First Name</label>
                    <Input value={editForm.first_name} onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))} placeholder="First name" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Last Name</label>
                    <Input value={editForm.last_name} onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))} placeholder="Last name" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                    <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full display name" />
                  </div>
                </div>
              </div>

              {/* Work */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Work</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Company</label>
                    <Input value={editForm.company} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} placeholder="Company" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                    <Input value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))} placeholder="Job title" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                    <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
                  </div>
                </div>
              </div>

              {/* Social */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Social Links</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">LinkedIn URL</label>
                    <Input value={editForm.linkedin} onChange={(e) => setEditForm((f) => ({ ...f, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Twitter / X</label>
                    <Input value={editForm.twitter} onChange={(e) => setEditForm((f) => ({ ...f, twitter: e.target.value }))} placeholder="@handle or URL" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Instagram</label>
                    <Input value={editForm.instagram} onChange={(e) => setEditForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@handle" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Website</label>
                    <Input value={editForm.website} onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
                  </div>
                </div>
              </div>

              {/* Bio & metadata */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bio & Tags</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Bio / Summary</label>
                    <textarea
                      value={editForm.summary}
                      onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
                      placeholder="What this person does, what they're building..."
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Skills (comma-separated)</label>
                    <Input value={editForm.skills} onChange={(e) => setEditForm((f) => ({ ...f, skills: e.target.value }))} placeholder="React, Python, Design" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Events / Sources (comma-separated)</label>
                    <Input value={editForm.source} onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))} placeholder="Maker Mondays #3, Toronto Tech Week" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Notes (admin only)</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Internal notes about this person..."
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  const now = new Date().toISOString();
                  const payload = {
                    first_name: editForm.first_name.trim() || null,
                    last_name: editForm.last_name.trim() || null,
                    name: editForm.name.trim() || null,
                    company: editForm.company.trim() || null,
                    role: editForm.role.trim() || null,
                    phone: editForm.phone.trim() || null,
                    linkedin: editForm.linkedin.trim() || null,
                    twitter: editForm.twitter.trim() || null,
                    instagram: editForm.instagram.trim() || null,
                    website: editForm.website.trim() || null,
                    summary: editForm.summary.trim() || null,
                    skills: editForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
                    source: editForm.source.split(",").map((s) => s.trim()).filter(Boolean),
                    notes: editForm.notes.trim() || null,
                    // `updated_at` is stamped by the route.
                  };
                  const result = await updateContact(contact.id, payload);
                  if (result.success) {
                    setContact({ ...contact, ...payload, updated_at: now });
                    setEditing(false);
                  }
                  setSaving(false);
                }}
              >
                <Check className="w-4 h-4 mr-1" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
