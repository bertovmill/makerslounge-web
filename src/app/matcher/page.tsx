"use client";

import { useState, useCallback, useEffect } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Contact {
  [key: string]: string;
}

interface Group {
  members: string[];
  reason: string;
}

interface MatcherEvent {
  id: string;
  name: string;
  contacts: Contact[];
  groups: Group[] | null;
  created_at: string;
}

export default function MatcherPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState(4);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGrouping, setIsGrouping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedEvents, setSavedEvents] = useState<MatcherEvent[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load saved events on mount
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("matcher_events")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (data) setSavedEvents(data);
      }
    };
    init();
  }, []);

  const parseCSV = useCallback((file: File) => {
    setFileName(file.name);
    setGroups([]);
    setError(null);

    Papa.parse<Contact>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Get all headers from the CSV
        const allHeaders = results.meta.fields || [];

        // Filter out empty/useless columns
        const usefulHeaders = allHeaders.filter(h =>
          h && h.trim() && !h.startsWith("__")
        );

        // Filter to only approved contacts
        const approvedContacts = results.data.filter(
          (contact) => contact.approval_status === "approved"
        );

        setHeaders(usefulHeaders);
        setContacts(approvedContacts);
      },
      error: (error) => {
        console.error("CSV Parse error:", error);
        setError("Failed to parse CSV file");
      },
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
        parseCSV(file);
      }
    },
    [parseCSV]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        parseCSV(file);
      }
    },
    [parseCSV]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const clearData = () => {
    setContacts([]);
    setHeaders([]);
    setFileName(null);
    setGroups([]);
    setError(null);
    setCurrentEventId(null);
    setEventName("");
  };

  const saveEvent = async () => {
    if (!userId || !eventName.trim()) {
      setError("Please enter an event name");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (currentEventId) {
        // Update existing
        const { error } = await supabase
          .from("matcher_events")
          .update({ contacts, groups, name: eventName })
          .eq("id", currentEventId);
        if (error) throw error;

        setSavedEvents(savedEvents.map(e =>
          e.id === currentEventId ? { ...e, contacts, groups, name: eventName } : e
        ));
      } else {
        // Create new
        const { data, error } = await supabase
          .from("matcher_events")
          .insert({ user_id: userId, name: eventName, contacts, groups })
          .select()
          .single();
        if (error) throw error;

        setSavedEvents([data, ...savedEvents]);
        setCurrentEventId(data.id);
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  const loadEvent = (event: MatcherEvent) => {
    setContacts(event.contacts);
    setGroups(event.groups || []);
    setEventName(event.name);
    setCurrentEventId(event.id);
    setFileName(null);

    // Get headers from the first contact's keys
    if (event.contacts.length > 0) {
      setHeaders(Object.keys(event.contacts[0]));
    }
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("matcher_events").delete().eq("id", id);
    if (!error) {
      setSavedEvents(savedEvents.filter(e => e.id !== id));
      if (currentEventId === id) clearData();
    }
  };

  const generateGroups = async () => {
    setIsGrouping(true);
    setError(null);
    setGroups([]);

    try {
      const response = await fetch("/api/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: contacts.map((c) => ({
            name: c.name,
            email: c.email,
            project: c.project,
            phase: c.phase,
            skills: c.skills,
            needsHelp: c.needsHelp,
          })),
          groupSize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate groups");
      }

      setGroups(data.groups);
    } catch (err) {
      console.error("Grouping error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate groups");
    } finally {
      setIsGrouping(false);
    }
  };

  const getContactByName = (name: string) => {
    return contacts.find((c) => c.name === name);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold">Matcher</h1>
          <p className="text-muted-foreground mt-1">
            Upload your guest list and create maker groups
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Upload Section */}
        {contacts.length === 0 ? (
          <div className="space-y-6">
            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium">Drop your CSV here</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    or click to browse
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button variant="outline" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Saved Events */}
            {savedEvents.length > 0 && (
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-4">Saved Events</h2>
                <div className="space-y-2">
                  {savedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => loadEvent(event)}
                        className="flex-1 text-left"
                      >
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.contacts.length} contacts
                          {event.groups ? ` • ${event.groups.length} groups` : ""}
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Event Name & Save */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Event name (e.g., MakersLounge Meetup #7)"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={saveEvent} disabled={isSaving || !userId}>
                    {isSaving ? "Saving..." : currentEventId ? "Update" : "Save"}
                  </Button>
                  <Button variant="outline" onClick={clearData}>
                    Clear
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {fileName ? `Uploaded: ${fileName} • ` : ""}
                {contacts.length} contacts loaded
                {currentEventId && " • Saved"}
              </p>
            </div>

            {/* Smart Grouping */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
              <h2 className="text-lg font-semibold mb-3">Smart Grouping</h2>
              <p className="text-muted-foreground text-sm mb-4">
                AI will analyze each person&apos;s skills, projects, and needs to create optimal groups
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Group size:</label>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="px-3 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value={2}>Pairs (2)</option>
                    <option value={3}>Small (3)</option>
                    <option value={4}>Medium (4)</option>
                    <option value={5}>Large (5)</option>
                    <option value={6}>Tables (6)</option>
                  </select>
                </div>

                <Button
                  onClick={generateGroups}
                  disabled={isGrouping || contacts.length < 2}
                >
                  {isGrouping ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Grouping...
                    </>
                  ) : (
                    "Generate Smart Groups"
                  )}
                </Button>
              </div>
            </div>

            {/* Generated Groups */}
            {groups.length > 0 && (
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    Generated Groups ({groups.length})
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => setGroups([])}>
                    Clear Groups
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {groups.map((group, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/30 rounded-xl p-4 border border-border"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {group.members.length} members
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        {group.members.map((name, i) => {
                          const contact = getContactByName(name);
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <span className="font-medium">{name}</span>
                              {contact?.LinkedIn && (
                                <a
                                  href={contact.LinkedIn}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary text-xs hover:underline"
                                >
                                  LinkedIn
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-sm text-muted-foreground bg-background/50 rounded-lg p-2">
                        {group.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contacts Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">All Contacts ({contacts.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {contacts.map((contact, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        {headers.map((header) => (
                          <td
                            key={header}
                            className="px-3 py-2 max-w-[200px] truncate"
                            title={contact[header] || ""}
                          >
                            {contact[header] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
