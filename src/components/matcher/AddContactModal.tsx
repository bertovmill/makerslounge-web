"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { MatcherContact } from "@/app/matcher/page";

interface AddContactModalProps {
  userId: string;
  existingEmails: string[];
  onClose: () => void;
  onSave: (contact: MatcherContact) => void;
}

export default function AddContactModal({
  userId,
  existingEmails,
  onClose,
  onSave,
}: AddContactModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSave = async () => {
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (existingEmails.includes(email.trim().toLowerCase())) {
      setError("A contact with this email already exists");
      return;
    }

    setSaving(true);

    try {
      const { data, error: insertError } = await supabase
        .from("matcher_contacts")
        .insert({
          user_id: userId,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          setError("A contact with this email already exists");
        } else {
          setError("Failed to add contact");
        }
        setSaving(false);
        return;
      }

      onSave(data);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to add contact");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-serif font-bold mb-6">Add Contact</h2>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl outline-none focus:border-primary"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl outline-none focus:border-primary"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl outline-none focus:border-primary resize-none"
              placeholder="Optional notes about this contact"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Adding..." : "Add Contact"}
          </Button>
        </div>
      </div>
    </div>
  );
}
