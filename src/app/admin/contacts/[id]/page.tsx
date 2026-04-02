"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
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

export default function ContactEditPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [metadata, setMetadata] = useState<Record<string, string> | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<MatchedProfile | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !isAdmin) return;

    const fetchContact = async () => {
      const { data, error } = await supabase
        .from("community_contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Contact not found");
        setLoading(false);
        return;
      }

      setForm({
        email: data.email || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        name: data.name || "",
        notes: data.notes || "",
        skills: (data.skills || []).join(", "),
        company: data.company || "",
        role: data.role || "",
        source: (data.source || []).join(", "),
        phone: data.phone || "",
        linkedin: data.linkedin || "",
        twitter: data.twitter || "",
        instagram: data.instagram || "",
        website: data.website || "",
      });

      if (data.metadata && Object.keys(data.metadata).length > 0) {
        setMetadata(data.metadata);
      }

      if (data.matched_profile_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, name, username, bio")
          .eq("id", data.matched_profile_id)
          .single();
        if (profile) setMatchedProfile(profile);
      }

      setLoading(false);
    };

    fetchContact();
  }, [id, isNew, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      email: form.email.trim().toLowerCase(),
      first_name: form.first_name.trim() || null,
      last_name: form.last_name.trim() || null,
      name: form.name.trim() || null,
      notes: form.notes.trim() || null,
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      company: form.company.trim() || null,
      role: form.role.trim() || null,
      source: form.source.split(",").map((s) => s.trim()).filter(Boolean),
      phone: form.phone.trim() || null,
      linkedin: form.linkedin.trim() || null,
      twitter: form.twitter.trim() || null,
      instagram: form.instagram.trim() || null,
      website: form.website.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isNew) {
        const { error } = await supabase
          .from("community_contacts")
          .insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("community_contacts")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      }
      router.push("/admin/contacts");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      if (msg.includes("duplicate key") || msg.includes("community_contacts_email_idx")) {
        setError("A contact with this email already exists");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push("/admin/contacts")}>
          &larr; Back to Contacts
        </Button>
      </div>

      <Badge variant="secondary" className="mb-4">
        Admin
      </Badge>
      <h1 className="text-3xl font-bold mb-6">
        {isNew ? "Add Contact" : "Edit Contact"}
      </h1>

      {matchedProfile && (
        <Card className="p-4 mb-6 border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-green-600">Matched</Badge>
            <div>
              <p className="font-medium">{matchedProfile.name || "Unnamed"}</p>
              {matchedProfile.username && (
                <p className="text-sm text-muted-foreground">
                  @{matchedProfile.username}
                </p>
              )}
              {matchedProfile.bio && (
                <p className="text-sm text-muted-foreground mt-1">
                  {matchedProfile.bio}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => router.push(`/profile/${matchedProfile.id}`)}
            >
              View Profile
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">First Name</label>
                <Input
                  value={form.first_name}
                  onChange={update("first_name")}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Last Name</label>
                <Input
                  value={form.last_name}
                  onChange={update("last_name")}
                  placeholder="Last name"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  Display Name
                </label>
                <Input
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Full display name (optional)"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Company</label>
                <Input
                  value={form.company}
                  onChange={update("company")}
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role</label>
                <Input
                  value={form.role}
                  onChange={update("role")}
                  placeholder="Job title / role"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="Phone number"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Sources (comma-separated)</label>
                <Input
                  value={form.source}
                  onChange={update("source")}
                  placeholder='e.g. "Maker Mondays #12, Toronto Tech Week"'
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  Skills (comma-separated)
                </label>
                <Input
                  value={form.skills}
                  onChange={update("skills")}
                  placeholder="React, Python, Design"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={update("notes")}
                  placeholder="Any notes about this contact"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Social Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">LinkedIn</label>
                <Input
                  value={form.linkedin}
                  onChange={update("linkedin")}
                  placeholder="LinkedIn URL"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Twitter / X</label>
                <Input
                  value={form.twitter}
                  onChange={update("twitter")}
                  placeholder="Twitter handle or URL"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Instagram</label>
                <Input
                  value={form.instagram}
                  onChange={update("instagram")}
                  placeholder="Instagram handle"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Website</label>
                <Input
                  value={form.website}
                  onChange={update("website")}
                  placeholder="Website URL"
                />
              </div>
            </div>
          </div>

          {metadata && Object.keys(metadata).length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Additional Data (from CSV)</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="px-3 py-2 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground capitalize">
                      {key.replace(/[_-]/g, " ")}
                    </p>
                    <p className="text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isNew ? "Add Contact" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/contacts")}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
