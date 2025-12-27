"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import ContactTable from "@/components/matcher/ContactTable";
import CSVUploader from "@/components/matcher/CSVUploader";

export interface MatcherContact {
  id: string;
  email: string;
  name: string;
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
  const [matchingCriteria, setMatchingCriteria] = useState("interests");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);

      // Load custom columns from localStorage
      const savedColumns = localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (savedColumns) {
        try {
          setColumns(JSON.parse(savedColumns));
        } catch (e) {
          console.error("Failed to parse saved columns:", e);
        }
      }

      await fetchContacts(user.id);
      setLoading(false);
    };

    init();
  }, [router]);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    if (columns.length > 0) {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columns));
    }
  }, [columns]);

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
      email: email.toLowerCase(),
      name,
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
      if (error.code === "23505") {
        showMessage("Contact with this email already exists");
      } else {
        showMessage(`Failed to add contact: ${error.message || error.code || 'Unknown error'}`);
      }
      return;
    }

    setContacts([data, ...contacts]);
  };

  const handleBulkAdd = useCallback(async (rows: { email: string; name: string; customFields?: Record<string, string> }[]) => {
    if (!user || rows.length === 0) return;

    const { data, error } = await supabase
      .from("matcher_contacts")
      .upsert(
        rows.map(r => ({
          user_id: user.id,
          email: r.email.toLowerCase(),
          name: r.name,
          custom_fields: r.customFields || {},
        })),
        { onConflict: "user_id,email" }
      )
      .select();

    if (error) {
      showMessage("Failed to add contacts");
      return;
    }

    const newContacts = data || [];
    const existingEmails = new Set(contacts.map(c => c.email));
    const toAdd = newContacts.filter(c => !existingEmails.has(c.email));

    setContacts([...toAdd, ...contacts]);
    showMessage(`Added ${toAdd.length} contact${toAdd.length !== 1 ? "s" : ""}`);
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
    setContacts([...imported, ...contacts.filter(c =>
      !imported.some(i => i.email === c.email)
    )]);
    showMessage(`Imported ${imported.length} contacts!`);
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

  const generatePairs = () => {
    if (contacts.length < 2) {
      showMessage("Need at least 2 contacts to generate pairs");
      return;
    }

    // Group contacts by their interest (case-insensitive)
    const groups: Record<string, MatcherContact[]> = {};
    const unmatched: MatcherContact[] = [];

    contacts.forEach((contact) => {
      const interest = contact.custom_fields?.[matchingCriteria]?.toLowerCase().trim();
      if (interest) {
        if (!groups[interest]) groups[interest] = [];
        groups[interest].push(contact);
      } else {
        unmatched.push(contact);
      }
    });

    const newPairs: Pair[] = [];

    // Pair people within the same interest group
    Object.entries(groups).forEach(([interest, members]) => {
      for (let i = 0; i < members.length - 1; i += 2) {
        newPairs.push({
          person1: members[i],
          person2: members[i + 1],
          reason: `Both interested in ${interest}`,
        });
      }
      // If odd number, add last person to unmatched
      if (members.length % 2 === 1) {
        unmatched.push(members[members.length - 1]);
      }
    });

    // Pair remaining unmatched people randomly
    for (let i = 0; i < unmatched.length - 1; i += 2) {
      newPairs.push({
        person1: unmatched[i],
        person2: unmatched[i + 1],
        reason: "Random pairing",
      });
    }

    setPairs(newPairs);
    showMessage(`Generated ${newPairs.length} pair${newPairs.length !== 1 ? "s" : ""}`);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold">Matcher</h1>
            <p className="text-muted-foreground mt-1">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowCSVUploader(!showCSVUploader)}
          >
            {showCSVUploader ? "Hide CSV Import" : "Import CSV"}
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-6 text-sm">
            {message}
          </div>
        )}

        {/* CSV Upload (collapsible) */}
        {showCSVUploader && (
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
            <h2 className="text-lg font-semibold mb-4">Import from CSV</h2>
            <CSVUploader
              userId={user?.id || ""}
              onImport={handleImportContacts}
              existingEmails={contacts.map(c => c.email)}
            />
          </div>
        )}

        {/* Contacts Table */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
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
