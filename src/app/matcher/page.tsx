"use client";

import { useState, useCallback, useEffect } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Group, StepEvent, GroupEvent, CompleteEvent, TokenUsage } from "@/types/matcher";
import AgentWorkflow, { type AgentTurn, type ToolCall } from "@/components/matcher/AgentWorkflow";
import LoaderIcon from "@/components/matcher/LoaderIcon";

interface Contact {
  [key: string]: string;
}

interface Recommendation {
  name: string;
  reason: string;
  matchStrength: number;
}

interface MatcherProgress {
  step: string;
  phase?: string;
  icon?: string;
}

interface ThinkingLog {
  text: string;
  timestamp: number;
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

  // Recommendation chat state
  const [recommendQuery, setRecommendQuery] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendAnswer, setRecommendAnswer] = useState("");
  const [isRecommending, setIsRecommending] = useState(false);


  // Streaming progress state
  const [matcherProgress, setMatcherProgress] = useState<MatcherProgress | null>(null);
  const [thinkingLogs, setThinkingLogs] = useState<ThinkingLog[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [agentTurns, setAgentTurns] = useState<AgentTurn[]>([]);
  const [turnProgress, setTurnProgress] = useState<{ current: number; max: number } | null>(null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

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
    setThinkingLogs([]);
    setTokenUsage(null);
    setAgentTurns([]);
    setTurnProgress(null);
    setSelectedStep(null);
    setMatcherProgress({ step: "Starting agent...", phase: "starting", icon: "0" });

    // Create an abort controller with a 3.5-minute timeout (slightly longer than server's 3 min)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 210000); // 3.5 minutes

    try {
      const response = await fetch("/api/agents/matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts, // Send all contact data, not just mapped fields
          groupSize,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start matcher agent");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (eventType) {
                case "ping": {
                  // Keepalive ping from server - ignore silently
                  break;
                }
                case "step": {
                  const stepData = data as StepEvent;
                  setMatcherProgress({
                    step: stepData.step,
                    phase: stepData.phase,
                    icon: stepData.icon,
                  });
                  break;
                }
                case "thinking": {
                  setThinkingLogs((prev) => [
                    ...prev,
                    { text: data.text, timestamp: Date.now() },
                  ]);
                  break;
                }
                case "turn_start": {
                  const turnNum = data.turn as number;
                  const maxTurns = (data.maxTurns as number) || 20;
                  setTurnProgress({ current: turnNum, max: maxTurns });
                  setAgentTurns((prev) => [
                    ...prev,
                    { turn: turnNum, toolCalls: [], timestamp: Date.now() },
                  ]);
                  break;
                }
                case "turn_thinking": {
                  const { turn: tTurn, thinking } = data as { turn: number; thinking: string };
                  setAgentTurns((prev) =>
                    prev.map((t) =>
                      t.turn === tTurn ? { ...t, thinking } : t
                    )
                  );
                  break;
                }
                case "tool_call": {
                  const { turn: tcTurn, id, name, input, status } = data as {
                    turn: number;
                    id: string;
                    name: string;
                    input: Record<string, unknown>;
                    status: "running" | "complete";
                  };
                  setAgentTurns((prev) =>
                    prev.map((t) =>
                      t.turn === tcTurn
                        ? {
                            ...t,
                            toolCalls: [
                              ...t.toolCalls,
                              { id, name, input, status, timestamp: Date.now() },
                            ],
                          }
                        : t
                    )
                  );
                  break;
                }
                case "tool_result": {
                  const { turn: trTurn, id: trId, result } = data as {
                    turn: number;
                    id: string;
                    result: unknown;
                  };
                  setAgentTurns((prev) =>
                    prev.map((t) =>
                      t.turn === trTurn
                        ? {
                            ...t,
                            toolCalls: t.toolCalls.map((tc) =>
                              tc.id === trId
                                ? { ...tc, result, status: "complete" as const }
                                : tc
                            ),
                          }
                        : t
                    )
                  );
                  break;
                }
                case "group": {
                  const groupData = data as GroupEvent;
                  setGroups((prev) => {
                    // Only add if not already present
                    if (prev.length <= groupData.index) {
                      return [...prev, groupData.group];
                    }
                    return prev;
                  });
                  setMatcherProgress((prev) => ({
                    ...prev,
                    step: `Formed group ${groupData.index + 1}...`,
                    icon: "4",
                  }));
                  break;
                }
                case "tokens": {
                  setTokenUsage(data as TokenUsage);
                  break;
                }
                case "complete": {
                  const completeData = data as CompleteEvent;
                  setGroups(completeData.groups);
                  if (completeData.tokens) {
                    setTokenUsage(completeData.tokens);
                  }
                  setMatcherProgress(null);
                  break;
                }
                case "error": {
                  throw new Error(data.error);
                }
              }
            } catch (parseErr) {
              // Ignore JSON parse errors for incomplete data
              if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
                console.error("SSE parse error:", parseErr);
              }
            }
            eventType = "";
          }
        }
      }
    } catch (err) {
      console.error("Grouping error:", err);
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. The agent took too long to respond. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate groups");
      }
      setMatcherProgress(null);
    } finally {
      clearTimeout(timeoutId);
      setIsGrouping(false);
    }
  };

  const getContactByName = (name: string) => {
    return contacts.find((c) => c.name === name);
  };

  const getRecommendations = async () => {
    if (!recommendQuery.trim() || contacts.length === 0) return;

    setIsRecommending(true);
    setError(null);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: recommendQuery,
          contacts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get recommendations");
      }

      setRecommendations(data.recommendations);
      setRecommendAnswer(data.answer);

      // Save recommendations to event if we have one
      if (currentEventId && userId) {
        await supabase
          .from("matcher_events")
          .update({
            last_query: recommendQuery,
            last_recommendations: data.recommendations,
          })
          .eq("id", currentEventId);
      }
    } catch (err) {
      console.error("Recommendation error:", err);
      setError(err instanceof Error ? err.message : "Failed to get recommendations");
    } finally {
      setIsRecommending(false);
    }
  };

  const clearRecommendations = () => {
    setRecommendations([]);
    setRecommendAnswer("");
    setRecommendQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Matcher</h1>
          <p className="text-muted-foreground mt-2">
            Upload your guest list and create maker groups with AI-powered matching
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl mb-6 text-sm border border-destructive/20">
            {error}
          </div>
        )}

        {/* Upload Section */}
        {contacts.length === 0 ? (
          <div className="space-y-8">
            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`glass-card rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer ${
                isDragging
                  ? "border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border border-border hover:border-primary/40 hover:shadow-lg"
              }`}
            >
              <label htmlFor="csv-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center gap-5">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isDragging
                      ? "bg-primary text-white scale-110"
                      : "bg-primary/10 text-primary"
                  }`}>
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold">Drop your CSV here</p>
                    <p className="text-muted-foreground">
                      or click anywhere to browse files
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Accepts .csv files
                  </div>
                </div>
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
            </div>

            {/* Saved Events */}
            {savedEvents.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Saved Events</h2>
                <div className="space-y-2">
                  {savedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <button
                        onClick={() => loadEvent(event)}
                        className="flex-1 text-left"
                      >
                        <p className="font-medium group-hover:text-primary transition-colors">{event.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.contacts.length} contacts
                          {event.groups ? ` • ${event.groups.length} groups` : ""}
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
            <div className="pb-6 mb-6 border-b border-border/50">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Event name (e.g., MakersLounge Meetup #7)"
                    className="w-full px-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
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
              <p className="text-sm text-muted-foreground mt-3">
                {fileName ? `Uploaded: ${fileName} • ` : ""}
                {contacts.length} contacts loaded
                {currentEventId && " • Saved"}
              </p>
            </div>

            {/* Smart Grouping */}
            <div className="pb-6 mb-6 border-b border-border/50">
              {isGrouping ? (
                // Show progress while grouping
                <div className="space-y-4">
                  <div>
                      {/* Turn counter */}
                      {turnProgress && (
                        <div className="text-xs text-muted-foreground mb-2">
                          Turn {turnProgress.current}/{turnProgress.max}
                          {turnProgress.current > 10 && (
                            <span className="text-amber-500 ml-2">
                              (approaching limit)
                            </span>
                          )}
                        </div>
                      )}
                      {/* Progress phases indicator with animated loader */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {[
                          { num: "1", label: "Explore", description: "Reading all contact data to understand who's attending, their skills, projects, and what they're looking for." },
                          { num: "2", label: "Analyze", description: "Finding patterns and synergies — who has skills others need, complementary interests, and potential collaboration opportunities." },
                          { num: "3", label: "Propose", description: "Creating balanced groups by matching complementary skills and needs, ensuring diverse perspectives in each group." },
                          { num: "4", label: "Verify", description: "Checking that everyone is assigned to exactly one group, no duplicates, and group sizes are balanced." },
                          { num: "5", label: "Submit", description: "Finalizing the verified groups and preparing the results for display." },
                        ].map(({ num, label, description }) => {
                          const isActive = matcherProgress?.icon === num;
                          const isComplete = parseInt(matcherProgress?.icon || "0") > parseInt(num);
                          const isSelected = selectedStep === num;
                          return (
                            <div key={num} className="flex items-center gap-1">
                              {/* Show loader icon next to active step */}
                              {isActive && (
                                <LoaderIcon size="sm" className="mr-1" />
                              )}
                              <button
                                onClick={() => setSelectedStep(isSelected ? null : num)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all cursor-pointer hover:scale-105 ${
                                  isActive
                                    ? "bg-primary text-white"
                                    : isComplete
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                } ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                              >
                                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                                  {num}
                                </span>
                                <span className="hidden sm:inline">{label}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Step explanation panel - shows for selected OR active step */}
                      {(() => {
                        const showStep = selectedStep || matcherProgress?.icon;
                        if (!showStep || showStep === "0") return null;
                        const stepInfo: Record<string, { label: string; description: string }> = {
                          "1": { label: "Explore", description: "Reading all contact data to understand who's attending, their skills, projects, and what they're looking for." },
                          "2": { label: "Analyze", description: "Finding patterns and synergies — who has skills others need, complementary interests, and potential collaboration opportunities." },
                          "3": { label: "Propose", description: "Creating balanced groups by matching complementary skills and needs, ensuring diverse perspectives in each group." },
                          "4": { label: "Verify", description: "Checking that everyone is assigned to exactly one group, no duplicates, and group sizes are balanced." },
                          "5": { label: "Submit", description: "Finalizing the verified groups and preparing the results for display." },
                        };
                        const info = stepInfo[showStep];
                        if (!info) return null;
                        return (
                          <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex items-start gap-2">
                              <span className="text-primary font-medium text-sm shrink-0">
                                {info.label}:
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {info.description}
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Agent Workflow Visualization */}
                      <AgentWorkflow
                        turns={agentTurns}
                        currentPhase={matcherProgress?.phase || "starting"}
                        isRunning={isGrouping}
                      />

                    {/* Show groups as they form */}
                    {groups.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {groups.map((group, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-medium animate-in fade-in slide-in-from-bottom-1 duration-300"
                          >
                            {group.theme || `Group ${idx + 1}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-3">Smart Grouping</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    AI will analyze each person&apos;s skills, projects, and needs to create optimal groups
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium">Split into:</label>
                      <select
                        value={groupSize}
                        onChange={(e) => setGroupSize(Number(e.target.value))}
                        className="px-3 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all cursor-pointer"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>
                            {n} groups {contacts.length > 0 && `(~${Math.ceil(contacts.length / n)} each)`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      onClick={generateGroups}
                      disabled={contacts.length < 2}
                    >
                      Generate Smart Groups
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* AI Recommendations Chat */}
            {groups.length > 0 && (
              <div className="pb-6 mb-6 border-b border-border/50">
                <h2 className="text-lg font-semibold mb-2">Who should I talk to?</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Ask AI to recommend people based on what you&apos;re looking for
                </p>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={recommendQuery}
                    onChange={(e) => setRecommendQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && getRecommendations()}
                    placeholder="e.g., I need help with fundraising, Looking for a technical co-founder..."
                    className="flex-1 px-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    disabled={isRecommending}
                  />
                  <Button onClick={getRecommendations} disabled={isRecommending || !recommendQuery.trim()}>
                    {isRecommending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Finding...
                      </span>
                    ) : (
                      "Find People"
                    )}
                  </Button>
                  {recommendations.length > 0 && (
                    <Button variant="outline" onClick={clearRecommendations}>
                      Clear
                    </Button>
                  )}
                </div>

                {/* AI Answer */}
                {recommendAnswer && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <p className="text-sm text-emerald-800 dark:text-emerald-200">{recommendAnswer}</p>
                    </div>
                  </div>
                )}

                {/* Recommendation Cards */}
                {recommendations.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-semibold">
                            {rec.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{rec.name}</p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i <= rec.matchStrength ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">
                                {rec.matchStrength === 3 ? "Perfect match" : rec.matchStrength === 2 ? "Good match" : "Worth exploring"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generated Groups */}
            {groups.length > 0 && (
              <div className="pb-6 mb-6 border-b border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    Generated Groups ({groups.length})
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => setGroups([])}>
                    Clear Groups
                  </Button>
                </div>

                {/* Groups List */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {groups.map((group, idx) => (
                      <div
                        key={idx}
                        className="bg-muted/20 rounded-xl p-5 border border-border/50 hover:border-border transition-colors"
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

                        {/* Connection chips in list view */}
                        {group.connections && group.connections.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">Connections:</p>
                            <div className="flex flex-wrap gap-1">
                              {group.connections.map((conn, connIdx) => (
                                <span
                                  key={connIdx}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-[10px] bg-primary/10 text-primary"
                                  title={conn.reason}
                                >
                                  {conn.from.split(" ")[0]} → {conn.to.split(" ")[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {/* Contacts Table */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">All Contacts ({contacts.length})</h2>
              <div className="overflow-x-auto border border-border/50 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border/50">
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {contacts.map((contact, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
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
