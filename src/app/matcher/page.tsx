"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import ContactTable from "@/components/matcher/ContactTable";
import CSVUploader, { CSVUploaderRef } from "@/components/matcher/CSVUploader";

export interface MatcherContact {
  id: string;
  email: string | null;
  name: string | null;
  notes: string | null;
  custom_fields: Record<string, string> | null;
  created_at: string;
}

const COLUMNS_STORAGE_KEY = "matcher_custom_columns";

interface Pair {
  person1: MatcherContact;
  person2: MatcherContact;
  reason: string;
}

export default function MatcherPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<MatcherContact[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [showCSVUploader, setShowCSVUploader] = useState(false);
  const [message, setMessage] = useState("");
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [matchInstruction, setMatchInstruction] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const csvUploaderRef = useRef<CSVUploaderRef>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);

      // Don't load columns from localStorage - start fresh
      // Columns will be added when user imports CSV or adds them manually

      await fetchContacts(user.id);
      setLoading(false);
    };

    init();
  }, [router]);

  // Don't persist columns to localStorage - start fresh each time
  // (removed localStorage persistence)

  const fetchContacts = async (userId: string) => {
    const { data, error } = await supabase
      .from("matcher_contacts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    setContacts(data || []);
  };

  const handleAddContact = async (email: string, name: string, customFields?: Record<string, string>) => {
    if (!user) return;

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      email: email ? email.toLowerCase() : null,
      name: name || null,
    };

    // Only add custom_fields if provided
    if (customFields && Object.keys(customFields).length > 0) {
      insertData.custom_fields = customFields;
    }

    const { data, error } = await supabase
      .from("matcher_contacts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Add contact error:", error);
      showMessage(`Failed to add contact: ${error.message || error.code || 'Unknown error'}`);
      return;
    }

    setContacts([...contacts, data]);
  };

  const handleBulkAdd = useCallback(async (rows: { email: string; name: string; customFields?: Record<string, string> }[]) => {
    if (!user || rows.length === 0) return;

    const { data, error } = await supabase
      .from("matcher_contacts")
      .insert(
        rows.map(r => ({
          user_id: user.id,
          email: r.email ? r.email.toLowerCase() : null,
          name: r.name || null,
          custom_fields: r.customFields && Object.keys(r.customFields).length > 0 ? r.customFields : null,
        }))
      )
      .select();

    if (error) {
      showMessage("Failed to add contacts");
      return;
    }

    const newContacts = data || [];
    setContacts([...contacts, ...newContacts]);
    showMessage(`Added ${newContacts.length} contact${newContacts.length !== 1 ? "s" : ""}`);
  }, [user, contacts]);

  const handleUpdateContact = async (id: string, updates: Partial<MatcherContact>) => {
    const { error } = await supabase
      .from("matcher_contacts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user?.id);

    if (error) {
      console.error("Update error:", error);
      showMessage("Failed to update contact");
      return;
    }

    setContacts(contacts.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteContact = async (id: string) => {
    const { error } = await supabase
      .from("matcher_contacts")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id);

    if (error) {
      console.error("Delete error:", error);
      showMessage("Failed to delete contact");
      return;
    }

    setContacts(contacts.filter(c => c.id !== id));
  };

  const handleImportContacts = async (imported: MatcherContact[]) => {
    // Extract all unique custom field keys from imported contacts
    const customFieldKeys = new Set<string>();
    imported.forEach(contact => {
      if (contact.custom_fields) {
        Object.keys(contact.custom_fields).forEach(key => customFieldKeys.add(key));
      }
    });

    // Add new columns that don't already exist
    const newColumns = Array.from(customFieldKeys).filter(key => !columns.includes(key));
    if (newColumns.length > 0) {
      setColumns([...columns, ...newColumns]);
    }

    setContacts([...imported, ...contacts.filter(c =>
      !imported.some(i => i.email === c.email)
    )]);
    showMessage(`Imported ${imported.length} contacts with ${newColumns.length} new columns!`);
    setShowCSVUploader(false);
  };

  const handleAddColumn = (columnName: string) => {
    if (!columns.includes(columnName)) {
      setColumns([...columns, columnName]);
    }
  };

  const handleRemoveColumn = (columnName: string) => {
    setColumns(columns.filter(c => c !== columnName));
    // Optionally clear the data from contacts (keeping it in DB for now)
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleClearTable = async () => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete all contacts? This cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("matcher_contacts")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        showMessage("Failed to clear table");
        return;
      }

      setContacts([]);
      setColumns([]);
      setPairs([]);
      showMessage("Table cleared successfully");
    } catch (err) {
      console.error("Clear error:", err);
      showMessage("Failed to clear table");
    }
  };

  const generatePairs = async () => {
    if (contacts.length < 2) {
      showMessage("Need at least 2 contacts to generate pairs");
      return;
    }

    setIsMatching(true);
    setPairs([]);

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: contacts.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            custom_fields: c.custom_fields,
          })),
          instruction: matchInstruction || "Pair people with similar interests",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate matches");
      }

      // Map the API response to our Pair format
      const newPairs: Pair[] = data.pairs.map(
        (p: { person1_id: string; person2_id: string; reason: string }) => ({
          person1: contacts.find((c) => c.id === p.person1_id)!,
          person2: contacts.find((c) => c.id === p.person2_id)!,
          reason: p.reason,
        })
      ).filter((p: Pair) => p.person1 && p.person2);

      setPairs(newPairs);
      showMessage(`Generated ${newPairs.length} pair${newPairs.length !== 1 ? "s" : ""}`);
    } catch (error) {
      console.error("Matching error:", error);
      showMessage(error instanceof Error ? error.message : "Failed to generate matches");
    } finally {
      setIsMatching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold">Matcher</h1>
          <p className="text-muted-foreground mt-1">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* AI Matching Section */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
          <h2 className="text-lg font-semibold mb-3">AI Matching</h2>

          {/* Preset modes */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: "Similar interests", instruction: "Pair people with similar interests or hobbies" },
              { label: "Opposites attract", instruction: "Pair people with different interests so they can learn from each other" },
              { label: "Random pairs", instruction: "Create random pairs regardless of interests" },
              { label: "Networking mix", instruction: "Pair people who haven't met and have complementary backgrounds" },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setMatchInstruction(preset.instruction)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  matchInstruction === preset.instruction
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={matchInstruction}
              onChange={(e) => setMatchInstruction(e.target.value)}
              placeholder="Or type your own matching criteria..."
              className="flex-1 px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              onClick={generatePairs}
              disabled={contacts.length < 2 || isMatching}
            >
              {isMatching ? "Matching..." : "Generate Pairs"}
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-6 text-sm">
            {message}
          </div>
        )}

        {/* Generated Pairs */}
        {pairs.length > 0 && (
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generated Pairs</h2>
              <Button variant="outline" size="sm" onClick={() => setPairs([])}>
                Clear
              </Button>
            </div>
            <div className="grid gap-3">
              {pairs.map((pair, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-accent/30 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-medium">{pair.person1.name}</p>
                    <p className="text-sm text-muted-foreground">{pair.person1.email}</p>
                  </div>
                  <div className="text-2xl text-muted-foreground">↔</div>
                  <div className="flex-1">
                    <p className="font-medium">{pair.person2.name}</p>
                    <p className="text-sm text-muted-foreground">{pair.person2.email}</p>
                  </div>
                  <div className="text-sm text-muted-foreground bg-background px-3 py-1 rounded-full">
                    {pair.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CSV Upload */}
        {showCSVUploader && (
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
            <h2 className="text-lg font-semibold mb-4">Import from CSV</h2>
            <CSVUploader
              ref={csvUploaderRef}
              userId={user?.id || ""}
              onImport={handleImportContacts}
              existingEmails={contacts.map(c => c.email).filter((e): e is string => e !== null)}
              onShowPreview={() => setShowCSVUploader(true)}
              onCancel={() => setShowCSVUploader(false)}
            />
          </div>
        )}

        {/* Contacts Table */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Contacts</h2>
            <div className="flex gap-2">
              {contacts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearTable}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear Table
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  csvUploaderRef.current?.triggerFileInput();
                  setShowCSVUploader(true);
                }}
              >
                Import CSV
              </Button>
            </div>
          </div>
          <ContactTable
            contacts={contacts}
            columns={columns}
            onUpdate={handleUpdateContact}
            onDelete={handleDeleteContact}
            onAdd={handleAddContact}
            onBulkAdd={handleBulkAdd}
            onAddColumn={handleAddColumn}
            onRemoveColumn={handleRemoveColumn}
          />
        </div>
      </div>
    </div>
  );
}
