"use client";

import { useState, useEffect, useRef } from "react";
import {
  fetchMeetups,
  createMeetup,
  updateMeetup,
  deleteMeetup,
} from "@/lib/meetups-client";
import { syncProfileNotes } from "@/lib/profile-notes-client";
import { fetchProfiles, updateProfileAsAdmin } from "@/lib/profiles-client";
import { fetchContacts, createContact, updateContact } from "@/lib/contacts-client";
import { useAuth } from "@/context/AuthContext";
import {
  Search, X, Sparkles, RotateCcw, MessageSquareQuote,
  UserPlus, Pencil, Plus, ArrowLeft, Users, Trash2, Check, Copy, Linkedin, LayoutGrid, Table2, Download,
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  bio?: string | null;
  skills?: string[] | null;
  currently_building?: string | null;
  photo_url?: string | null;
  _source?: "profile" | "community";
  // community_contacts extra fields
  company?: string | null;
  role?: string | null;
  email?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  website?: string | null;
  notes?: string | null;
  looking_for_help?: string | null;
  // event-specific custom fields
  custom_fields?: Record<string, string>;
}

interface SavedMeetup {
  id: string;
  name: string;
  participants: Participant[];
  custom_field_names?: string[];
  created_at: string;
  updated_at: string;
}

interface MatchEntry {
  matched_id: string;
  matched_name: string;
  reason: string;
  conversation_starter: string;
}

interface PersonMatches {
  person_id: string;
  person_name: string;
  matches: MatchEntry[];
}

type Phase = "setup" | "processing" | "results";

function Avatar({ person, size = "md" }: { person: Participant; size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return person.photo_url ? (
    <img src={person.photo_url} alt={person.name} className={`${cls} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${cls} rounded-full bg-secondary flex items-center justify-center font-medium text-muted-foreground shrink-0`}>
      {person.name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function MeetupMatcherPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { isAdmin } = useAuth();

  // Meetup list
  const [meetups, setMeetups] = useState<SavedMeetup[]>([]);
  const [loadingMeetups, setLoadingMeetups] = useState(true);
  const [activeMeetup, setActiveMeetup] = useState<SavedMeetup | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // People pool
  const [allPeople, setAllPeople] = useState<Participant[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);

  // Editor state
  const [meetupName, setMeetupName] = useState("");
  const [selected, setSelected] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Matching
  const [phase, setPhase] = useState<Phase>("setup");
  const [statusMessage, setStatusMessage] = useState("");
  const [activityLog, setActivityLog] = useState<{ text: string; done: boolean }[]>([]);
  const [results, setResults] = useState<PersonMatches[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [linkedinMessages, setLinkedinMessages] = useState<Record<string, string>>({});
  const [linkedinGenerating, setLinkedinGenerating] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityLogRef = useRef<HTMLDivElement>(null);

  // Add person modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addSkills, setAddSkills] = useState("");
  const [addBio, setAddBio] = useState("");
  const [addCompany, setAddCompany] = useState("");
  const [addRole, setAddRole] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addLookingForHelp, setAddLookingForHelp] = useState("");
  const [addLinkedin, setAddLinkedin] = useState("");
  const [addTwitter, setAddTwitter] = useState("");
  const [addWebsite, setAddWebsite] = useState("");
  const [addCustomFields, setAddCustomFields] = useState<Record<string, string>>({});
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Participant view mode
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Custom event fields (meetup-level)
  const [customFieldNames, setCustomFieldNames] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState("");

  // Edit person modal
  const [editingPerson, setEditingPerson] = useState<Participant | null>(null);
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string>>({});
  const [editName, setEditName] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editBuilding, setEditBuilding] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLookingForHelp, setEditLookingForHelp] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load saved meetups
  useEffect(() => {
    loadMeetups();
  }, []);

  // Named `loadMeetups`: `fetchMeetups` is imported.
  async function loadMeetups() {
    const rows = await fetchMeetups();
    setMeetups(rows as unknown as SavedMeetup[]);
    setLoadingMeetups(false);
  }

  // Load people pool
  useEffect(() => {
    async function fetchPeople() {
      // Contacts come back only for an admin, or marked public — the route decides,
      // where before this relied on RLS returning nothing for a non-admin.
      const [profiles, contacts] = await Promise.all([
        fetchProfiles({ named: true, sort: "name" }),
        fetchContacts(),
      ]);

      const people: Participant[] = profiles
        .filter((p) => p.name?.trim())
        .map((p) => ({
          id: p.id,
          username: p.username,
          // Non-null by the filter above; `Participant.name` is required.
          name: p.name as string,
          bio: p.bio,
          skills: p.skills,
          photo_url: p.photo_url,
          currently_building: p.currently_building,
          looking_for_help: p.looking_for_help,
          _source: "profile" as const,
        }));

      for (const c of contacts) {
        const displayName = c.name || [c.first_name, c.last_name].filter(Boolean).join(" ");
        if (!displayName) continue;
        people.push({ id: c.id, name: displayName, bio: c.summary, skills: c.skills, photo_url: null, _source: "community" });
      }

      setAllPeople(people);
      setLoadingPeople(false);
    }
    fetchPeople();
  }, []);

  // Sync notes for registered profile participants to profile_event_notes
  async function syncProfileEventNotes(meetupId: string, meetupName: string, participants: Participant[], userId: string) {
    const toSync = participants.filter((p) => p._source === "profile" && p.notes?.trim());
    if (toSync.length === 0) return;
    // `created_by` is the session's now; `userId` is kept in the signature because the
    // callers still have it and removing it would touch four call sites for nothing.
    void userId;
    await syncProfileNotes(
      toSync.map((p) => ({
        profileId: p.id,
        meetupId,
        meetupName,
        notes: p.notes ?? null,
      })),
    );
  }

  // Auto-save when participants change (only for already-saved meetups)
  useEffect(() => {
    if (!activeMeetup || !isEditing || phase !== "setup") return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const user = authUser;
      if (!user) return;
      const data = await updateMeetup(activeMeetup.id, {
        name: meetupName.trim() || activeMeetup.name,
        participants: selected,
        customFieldNames,
      });
      if (data) {
        setActiveMeetup(data as SavedMeetup);
        setMeetups((prev) => prev.map((m) => (m.id === data.id ? (data as SavedMeetup) : m)));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        await syncProfileEventNotes(activeMeetup.id, meetupName.trim() || activeMeetup.name, selected, user.id);
      }
    }, 1000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function openMeetup(meetup: SavedMeetup) {
    setActiveMeetup(meetup);
    setMeetupName(meetup.name);
    setSelected(meetup.participants);
    setCustomFieldNames(meetup.custom_field_names || []);
    setPhase("setup");
    setResults([]);
    setMatchError(null);
    setSaved(false);
    setIsEditing(true);
  }

  function openNewMeetup() {
    setActiveMeetup(null);
    setMeetupName("");
    setSelected([]);
    setCustomFieldNames([]);
    setPhase("setup");
    setResults([]);
    setMatchError(null);
    setSaved(false);
    setIsEditing(true);
  }

  async function saveMeetup() {
    if (!meetupName.trim()) return;
    setSaving(true);

    const user = authUser;
    if (!user) { setSaving(false); return; }

    // No `created_by`: the route sets it from the session.
    const payload = {
      name: meetupName.trim(),
      participants: selected,
      customFieldNames,
    };

    if (activeMeetup) {
      const data = await updateMeetup(activeMeetup.id, payload);
      if (data) {
        setActiveMeetup(data as SavedMeetup);
        setMeetups((prev) => prev.map((m) => (m.id === data.id ? (data as SavedMeetup) : m)));
        await syncProfileEventNotes(activeMeetup.id, meetupName.trim(), selected, user.id);
      }
    } else {
      const data = await createMeetup(payload);
      if (data) {
        setActiveMeetup(data as SavedMeetup);
        setMeetups((prev) => [data as SavedMeetup, ...prev]);
        await syncProfileEventNotes(data.id, meetupName.trim(), selected, user.id);
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Named `removeMeetup`: a local `deleteMeetup` beside the import of the same name
  // shadowed it and called itself — infinite recursion, not a silent no-op.
  async function removeMeetup(id: string) {
    await deleteMeetup(id);
    setMeetups((prev) => prev.filter((m) => m.id !== id));
    if (activeMeetup?.id === id) { setActiveMeetup(null); setIsEditing(false); }
  }

  const filteredPeople = allPeople.filter((p) => {
    if (selected.some((s) => s.id === p.id)) return false;
    const q = search.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.bio?.toLowerCase().includes(q) || p.skills?.some((s) => s.toLowerCase().includes(q));
  });

  function addParticipant(person: Participant) {
    setSelected((prev) => [...prev, person]);
    setSaved(false);
    setSearch("");
    setShowDropdown(false);
    searchRef.current?.focus();
  }

  function removeParticipant(id: string) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
    setSaved(false);
  }

  function openAddModal() {
    setAddName(search.trim());
    setAddSkills("");
    setAddBio("");
    setAddCompany("");
    setAddRole("");
    setAddEmail("");
    setAddNotes("");
    setAddLookingForHelp("");
    setAddLinkedin("");
    setAddTwitter("");
    setAddWebsite("");
    setAddCustomFields({});
    setAddError(null);
    setShowDropdown(false);
    setShowAddModal(true);
  }

  function openEditModal(person: Participant) {
    setEditingPerson(person);
    setEditName(person.name);
    setEditBio(person.bio || "");
    setEditSkills(person.skills?.join(", ") || "");
    setEditBuilding(person.currently_building || "");
    setEditCompany(person.company || "");
    setEditRole(person.role || "");
    setEditEmail(person.email || "");
    setEditLinkedin(person.linkedin || "");
    setEditTwitter(person.twitter || "");
    setEditWebsite(person.website || "");
    setEditNotes(person.notes || "");
    setEditLookingForHelp(person.looking_for_help || "");
    setEditCustomFields(person.custom_fields || {});
    setEditError(null);
  }

  async function handleAddNewPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) return;
    setAddLoading(true);
    setAddError(null);

    const skillsArray = addSkills.split(",").map((s) => s.trim()).filter(Boolean);
    const createResult = await createContact({
        name: addName.trim(),
        summary: addBio.trim() || null,
        skills: skillsArray.length ? skillsArray : null,
        company: addCompany.trim() || null,
        role: addRole.trim() || null,
        email: addEmail.trim() || null,
        notes: addNotes.trim() || null,
        linkedin: addLinkedin.trim() || null,
        twitter: addTwitter.trim() || null,
        website: addWebsite.trim() || null,
    });

    if (!createResult.success || !createResult.data) {
      setAddError(createResult.error ?? "Could not add this person.");
      setAddLoading(false);
      return;
    }

    const newPerson: Participant = {
      id: createResult.data.id,
      name: addName.trim(),
      bio: addBio.trim() || null,
      skills: skillsArray.length ? skillsArray : null,
      company: addCompany.trim() || null,
      role: addRole.trim() || null,
      email: addEmail.trim() || null,
      notes: addNotes.trim() || null,
      looking_for_help: addLookingForHelp.trim() || null,
      linkedin: addLinkedin.trim() || null,
      twitter: addTwitter.trim() || null,
      website: addWebsite.trim() || null,
      custom_fields: Object.keys(addCustomFields).length ? addCustomFields : undefined,
      _source: "community",
    };
    addParticipant(newPerson);
    setAllPeople((prev) => [...prev, newPerson]);
    setShowAddModal(false);
    setAddLoading(false);
    setSearch("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPerson || !editName.trim()) return;
    setEditLoading(true);
    setEditError(null);

    const skillsArray = editSkills.split(",").map((s) => s.trim()).filter(Boolean);

    let updates: Record<string, unknown>;
    if (editingPerson._source === "community") {
      updates = {
        name: editName.trim(),
        skills: skillsArray.length ? skillsArray : null,
        summary: editBio.trim() || null,
        ...(isAdmin && {
          company: editCompany.trim() || null,
          role: editRole.trim() || null,
          email: editEmail.trim() || null,
          linkedin: editLinkedin.trim() || null,
          twitter: editTwitter.trim() || null,
          website: editWebsite.trim() || null,
          notes: editNotes.trim() || null,
        }),
      };
    } else {
      updates = {
        name: editName.trim(),
        skills: skillsArray.length ? skillsArray : null,
        bio: editBio.trim() || null,
        currently_building: editBuilding.trim() || null,
        looking_for_help: editLookingForHelp.trim() || null,
        ...(isAdmin && {
          linkedin: editLinkedin.trim() || null,
          twitter: editTwitter.trim() || null,
          website: editWebsite.trim() || null,
        }),
      };
    }

    // Two different resources behind one editor. Editing a registered member's profile
    // is the admin path — the old code wrote to `profiles` by id, which the row-owner
    // policy silently refused for anyone but yourself, so this never worked for other
    // members.
    const editResult =
      editingPerson._source === "profile"
        ? await updateProfileAsAdmin(editingPerson.id, updates)
        : await updateContact(editingPerson.id, updates);

    if (!editResult.success) {
      setEditError(editResult.error ?? "Could not save changes.");
      setEditLoading(false);
      return;
    }

    const updated: Participant = {
      ...editingPerson,
      name: editName.trim(),
      bio: editBio.trim() || null,
      skills: skillsArray.length ? skillsArray : null,
      currently_building: editBuilding.trim() || null,
      company: editCompany.trim() || null,
      role: editRole.trim() || null,
      email: editEmail.trim() || null,
      linkedin: editLinkedin.trim() || null,
      twitter: editTwitter.trim() || null,
      website: editWebsite.trim() || null,
      notes: editNotes.trim() || null,
      looking_for_help: editLookingForHelp.trim() || null,
      custom_fields: editCustomFields,
    };
    setSelected((prev) => prev.map((p) => (p.id === editingPerson.id ? updated : p)));
    setAllPeople((prev) => prev.map((p) => (p.id === editingPerson.id ? updated : p)));
    setSaved(false);
    setEditingPerson(null);
    setEditLoading(false);
  }

  async function generateMatches() {
    if (selected.length < 3) return;
    setPhase("processing");
    setMatchError(null);
    setStatusMessage("Starting analysis...");
    setActivityLog([{ text: "Starting analysis...", done: false }]);
    setLinkedinMessages({});
    setLinkedinGenerating({});

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const pushLog = (text: string) => {
      setActivityLog((prev) => {
        const next = prev.map((e, i) => i === prev.length - 1 ? { ...e, done: true } : e);
        return [...next, { text, done: false }];
      });
      setStatusMessage(text);
      setTimeout(() => {
        if (activityLogRef.current) {
          activityLogRef.current.scrollTop = activityLogRef.current.scrollHeight;
        }
      }, 50);
    };

    try {
      const resp = await fetch("/api/agents/meetup-matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetupName: meetupName.trim() || "Maker Meetup",
          participants: selected.map((p) => ({ id: p.id, name: p.name, bio: p.bio, skills: p.skills, currently_building: p.currently_building, company: p.company, role: p.role, notes: p.notes, looking_for_help: p.looking_for_help, custom_fields: p.custom_fields })),
          customFieldNames,
        }),
        signal: ctrl.signal,
      });

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";

        for (const part of parts) {
          const lines = part.trim().split("\n");
          const eventLine = lines.find((l) => l.startsWith("event: "));
          const dataLine = lines.find((l) => l.startsWith("data: "));
          if (!eventLine || !dataLine) continue;
          const eventType = eventLine.slice(7);
          let data: Record<string, unknown>;
          try { data = JSON.parse(dataLine.slice(6)); } catch { continue; }

          if (eventType === "step") pushLog(data.message as string);
          else if (eventType === "complete") {
            setActivityLog((prev) => prev.map((e, i) => i === prev.length - 1 ? { ...e, done: true } : e));
            setResults(data.matches as PersonMatches[]);
            setPhase("results");
          }
          else if (eventType === "error") { setMatchError(data.error as string); setPhase("setup"); }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") { setMatchError((err as Error).message || "Something went wrong"); setPhase("setup"); }
    }
  }

  function exportCSV() {
    const cols = ["name", "role", "company", "email", "bio", "skills", "looking_for_help", "notes", ...customFieldNames];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      cols.map(escape).join(","),
      ...selected.map((p) => cols.map((col) => {
        if (col === "skills") return escape((p.skills || []).join(", "));
        if (customFieldNames.includes(col)) return escape(p.custom_fields?.[col] || "");
        return escape(String((p as unknown as Record<string, unknown>)[col] || ""));
      }).join(",")),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meetupName.trim() || "meetup"}-participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function generateLinkedInMessage(personResult: PersonMatches) {
    const id = personResult.person_id;
    setLinkedinGenerating((prev) => ({ ...prev, [id]: true }));
    try {
      const resp = await fetch("/api/agents/meetup-matcher/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetupName: meetupName.trim() || "Maker Meetup",
          personName: personResult.person_name,
          matches: personResult.matches,
        }),
      });
      const data = await resp.json();
      if (data.message) {
        setLinkedinMessages((prev) => ({ ...prev, [id]: data.message }));
      }
    } finally {
      setLinkedinGenerating((prev) => ({ ...prev, [id]: false }));
    }
  }

  // ─── List view ──────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Meetup Matcher</h1>
            <p className="text-sm text-muted-foreground">Save your meetups and generate AI-powered connection matches</p>
          </div>
          <button
            onClick={openNewMeetup}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New meetup
          </button>
        </div>

        {loadingMeetups ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}
          </div>
        ) : meetups.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No meetups yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create your first meetup to start matching connections</p>
            <button
              onClick={openNewMeetup}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity mx-auto"
            >
              <Plus className="w-4 h-4" />
              New meetup
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meetups.map((meetup) => (
              <div
                key={meetup.id}
                className="group flex items-center gap-4 rounded-xl border border-border bg-background px-5 py-4 hover:border-foreground/20 transition-colors cursor-pointer"
                onClick={() => openMeetup(meetup)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">{meetup.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {meetup.participants.length} participant{meetup.participants.length !== 1 ? "s" : ""} · updated {formatDate(meetup.updated_at)}
                  </p>
                </div>
                {/* Participant avatars preview */}
                <div className="flex -space-x-2 shrink-0">
                  {meetup.participants.slice(0, 5).map((p) => (
                    <Avatar key={p.id} person={p} size="sm" />
                  ))}
                  {meetup.participants.length > 5 && (
                    <div className="w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                      +{meetup.participants.length - 5}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeMeetup(meetup.id); }}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Detail / editor view ───────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => { abortRef.current?.abort(); setIsEditing(false); setPhase("setup"); setResults([]); }}
          className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{meetupName || "New Meetup"}</h1>
          <p className="text-sm text-muted-foreground">
            {activeMeetup ? `Saved · ${formatDate(activeMeetup.updated_at)}` : "Unsaved"}
          </p>
        </div>
        {phase === "setup" && (
          <button
            onClick={saveMeetup}
            disabled={saving || !meetupName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-secondary transition-colors shrink-0"
          >
            {saved ? <Check className="w-4 h-4 text-green-500" /> : saving ? <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" /> : null}
            {saved ? "Saved" : saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>

      {/* Setup phase */}
      {phase === "setup" && (
        <div className="space-y-6">
          {/* Meetup name */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Meetup name</label>
            <input
              type="text"
              placeholder="e.g. Maker Monday — March 2026"
              value={meetupName}
              onChange={(e) => { setMeetupName(e.target.value); setSaved(false); }}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Event fields — admin only */}
          {isAdmin && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Event fields
                <span className="ml-2 text-muted-foreground font-normal text-xs">custom fields for each participant</span>
              </label>
              <div className="space-y-2">
                {customFieldNames.map((fieldName, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-secondary/40 text-sm text-foreground truncate">
                      {fieldName}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setCustomFieldNames((prev) => prev.filter((_, i) => i !== idx)); setSaved(false); }}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                      title="Remove field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. What brought you here?"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = newFieldName.trim();
                        if (trimmed && !customFieldNames.includes(trimmed)) {
                          setCustomFieldNames((prev) => [...prev, trimmed]);
                          setSaved(false);
                        }
                        setNewFieldName("");
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newFieldName.trim();
                      if (trimmed && !customFieldNames.includes(trimmed)) {
                        setCustomFieldNames((prev) => [...prev, trimmed]);
                        setSaved(false);
                      }
                      setNewFieldName("");
                    }}
                    disabled={!newFieldName.trim()}
                    className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Participant search */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Add participants
              {selected.length > 0 && <span className="ml-2 text-muted-foreground font-normal">({selected.length} added)</span>}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name, skill, or bio..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />

              {showDropdown && (search || allPeople.length > 0) && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 border border-border rounded-lg bg-background shadow-lg max-h-60 overflow-y-auto">
                  {loadingPeople ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">Loading...</div>
                  ) : (
                    <>
                      {filteredPeople.length === 0 && (
                        <div className="px-4 py-2.5 text-sm text-muted-foreground">
                          {search ? `No results for "${search}"` : "Everyone has been added"}
                        </div>
                      )}
                      {(search ? filteredPeople : filteredPeople.slice(0, 8)).map((person) => (
                        <button
                          key={person.id}
                          onMouseDown={() => addParticipant(person)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <Avatar person={person} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{person.name}</p>
                            {person.currently_building && (
                              <p className="text-xs text-muted-foreground truncate">Building {person.currently_building.replace(/[\[\]"]/g, "")}</p>
                            )}
                          </div>
                          {person.skills && person.skills.length > 0 && (
                            <div className="flex gap-1 shrink-0">
                              {person.skills.slice(0, 2).map((s) => (
                                <span key={s} className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">{s}</span>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                      {search.trim() && (
                        <button
                          onMouseDown={openAddModal}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors text-left border-t border-border/50"
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <UserPlus className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Add &ldquo;{search.trim()}&rdquo;</p>
                            <p className="text-xs text-muted-foreground">Save to community &amp; add to meetup</p>
                          </div>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Participant view toggle + list */}
          {selected.length > 0 && (
            <div className="space-y-3">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{selected.length} participant{selected.length !== 1 ? "s" : ""}</p>
                <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
                  <button
                    onClick={() => setViewMode("card")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "card" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    title="Card view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    title="Table view"
                  >
                    <Table2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card view */}
              {viewMode === "card" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selected.map((person) => (
                    <div key={person.id} className="relative rounded-xl border border-border bg-background p-4">
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <button onClick={() => openEditModal(person)} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeParticipant(person.id)} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded" title="Remove">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-start gap-3 mb-2.5">
                        <Avatar person={person} size="md" />
                        <div className="min-w-0 pr-10">
                          <h3 className="text-sm font-semibold truncate">{person.name}</h3>
                          {(person.role || person.company) && (
                            <p className="text-xs text-muted-foreground truncate">{[person.role, person.company].filter(Boolean).join(" @ ")}</p>
                          )}
                        </div>
                      </div>
                      {person.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{person.bio}</p>}
                      {person.skills && person.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {person.skills.slice(0, 4).map((skill) => (
                            <span key={skill} className="px-2 py-0.5 rounded-full bg-secondary text-[11px] text-secondary-foreground">{skill}</span>
                          ))}
                          {person.skills.length > 4 && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px] text-muted-foreground">+{person.skills.length - 4}</span>
                          )}
                        </div>
                      )}
                      {person.custom_fields && customFieldNames.some((f) => person.custom_fields?.[f]) && (
                        <div className="space-y-1 pt-1 border-t border-border/40 mt-1">
                          {customFieldNames.filter((f) => person.custom_fields?.[f]).map((f) => (
                            <div key={f}>
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{f}</span>
                              <p className="text-xs text-foreground/80 line-clamp-1">{person.custom_fields![f]}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Table view */}
              {viewMode === "table" && (
                <div className="rounded-xl border border-border overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Role / Company</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Email</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Bio</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Skills</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Looking for help</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Notes</th>
                        {customFieldNames.map((f) => (
                          <th key={f} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{f}</th>
                        ))}
                        <th className="px-4 py-2.5 w-16" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {selected.map((person) => (
                        <tr key={person.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar person={person} size="sm" />
                              <span className="font-medium text-sm">{person.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs text-muted-foreground">
                              {[person.role, person.company].filter(Boolean).join(" @ ") || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 max-w-[160px]">
                            <span className="text-xs text-muted-foreground truncate block">{person.email || "-"}</span>
                          </td>
                          <td className="px-4 py-2.5 max-w-[220px]">
                            <span className="text-xs text-muted-foreground truncate block">{person.bio || "-"}</span>
                          </td>
                          <td className="px-4 py-2.5 max-w-[220px]">
                            <span className="text-xs text-muted-foreground">
                              {person.skills && person.skills.length > 0
                                ? person.skills.slice(0, 4).join(", ") + (person.skills.length > 4 ? ` +${person.skills.length - 4}` : "")
                                : "-"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 max-w-[220px]">
                            <span className="text-xs text-muted-foreground truncate block">{person.looking_for_help || "-"}</span>
                          </td>
                          <td className="px-4 py-2.5 max-w-[200px]">
                            <span className="text-xs text-muted-foreground truncate block">{person.notes || "-"}</span>
                          </td>
                          {customFieldNames.map((f) => (
                            <td key={f} className="px-4 py-2.5 max-w-[180px]">
                              <span className="text-xs text-muted-foreground truncate block">{person.custom_fields?.[f] || "-"}</span>
                            </td>
                          ))}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => openEditModal(person)} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded" title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => removeParticipant(person.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded" title="Remove">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selected.length < 3 && (
                <p className="text-xs text-muted-foreground">
                  Add at least {3 - selected.length} more {3 - selected.length === 1 ? "participant" : "participants"} to generate matches
                </p>
              )}
            </div>
          )}

          {matchError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{matchError}</div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={generateMatches}
              disabled={selected.length < 3}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              Generate Top 3 Matches
            </button>
            {selected.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      )}

      {/* Processing */}
      {phase === "processing" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">May is analyzing your group</p>
              <p className="text-xs text-muted-foreground">{selected.length} participants · finding best connections...</p>
            </div>
          </div>

          <div
            ref={activityLogRef}
            className="rounded-xl border border-border bg-background overflow-y-auto max-h-80 divide-y divide-border/50"
          >
            {activityLog.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 shrink-0">
                  {entry.done ? (
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  )}
                </div>
                <p className={`text-sm leading-snug ${entry.done ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                  {entry.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {phase === "results" && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{meetupName || "Maker Meetup"}</h2>
              <p className="text-sm text-muted-foreground">{selected.length} participants · top 3 matches each</p>
            </div>
            <button
              onClick={() => setPhase("setup")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Edit meetup
            </button>
          </div>

          <div className="space-y-4">
            {results.map((personResult) => {
              const person = selected.find((p) => p.id === personResult.person_id);
              return (
                <div key={personResult.person_id} className="rounded-xl border border-border bg-background overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-secondary/20">
                    {person && <Avatar person={person} size="lg" />}
                    <div className="min-w-0">
                      <h3 className="font-semibold">{personResult.person_name}</h3>
                      {person?.currently_building && (
                        <p className="text-xs text-muted-foreground truncate">Building {person.currently_building.replace(/[\[\]"]/g, "")}</p>
                      )}
                      {person?.skills && person.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {person.skills.slice(0, 3).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {personResult.matches.map((match, idx) => {
                      const matchedPerson = selected.find((p) => p.id === match.matched_id);
                      return (
                        <div key={idx} className="flex gap-4 px-5 py-4">
                          <span className="text-xs font-bold text-muted-foreground/60 w-4 shrink-0 pt-0.5">{idx + 1}</span>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              {matchedPerson ? <Avatar person={matchedPerson} size="sm" /> : <div className="w-7 h-7 rounded-full bg-secondary shrink-0" />}
                              <span className="text-sm font-medium">{match.matched_name}</span>
                              {matchedPerson?.skills && matchedPerson.skills.length > 0 && (
                                <div className="flex gap-1 ml-auto shrink-0">
                                  {matchedPerson.skills.slice(0, 2).map((s) => (
                                    <span key={s} className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{match.reason}</p>
                            <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                              <MessageSquareQuote className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                              <p className="text-xs text-primary/90 leading-relaxed italic">{match.conversation_starter}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* LinkedIn message */}
                  <div className="border-t border-border/50 px-5 py-4 bg-secondary/10">
                    {linkedinMessages[personResult.person_id] ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Linkedin className="w-3.5 h-3.5" />
                            LinkedIn message
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(linkedinMessages[personResult.person_id]);
                              setCopiedId(personResult.person_id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedId === personResult.person_id ? (
                              <><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600">Copied</span></>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" />Copy</>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{linkedinMessages[personResult.person_id]}</p>
                      </>
                    ) : (
                      <button
                        onClick={() => generateLinkedInMessage(personResult)}
                        disabled={linkedinGenerating[personResult.person_id]}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                      >
                        {linkedinGenerating[personResult.person_id] ? (
                          <div className="w-3.5 h-3.5 border border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                        ) : (
                          <Linkedin className="w-3.5 h-3.5" />
                        )}
                        {linkedinGenerating[personResult.person_id] ? "Generating..." : "Generate LinkedIn message"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div>
                <h2 className="text-base font-semibold">Add new person</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Saves to the community and adds them to this meetup.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddNewPerson} className="flex flex-col min-h-0">
              <div className="overflow-y-auto px-6 space-y-4 pb-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Name <span className="text-destructive">*</span></label>
                  <input type="text" required autoFocus placeholder="Full name" value={addName} onChange={(e) => setAddName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Company</label>
                    <input type="text" placeholder="Acme Inc." value={addCompany} onChange={(e) => setAddCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                    <input type="text" placeholder="Founder, Engineer..." value={addRole} onChange={(e) => setAddRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                  <input type="email" placeholder="optional" value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio / What they&apos;re building</label>
                  <textarea rows={2} placeholder="Brief summary..." value={addBio} onChange={(e) => setAddBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Skills <span className="font-normal">(comma-separated)</span></label>
                  <input type="text" placeholder="React, AI, Design..." value={addSkills} onChange={(e) => setAddSkills(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Looking for help with</label>
                  <textarea rows={2} placeholder="e.g. Finding customers, fundraising, design feedback..." value={addLookingForHelp} onChange={(e) => setAddLookingForHelp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Socials</p>
                  <div className="space-y-2">
                    <div className="flex items-center h-9 rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                      <span className="pl-3 text-xs text-muted-foreground whitespace-nowrap">linkedin.com/in/</span>
                      <input type="text" placeholder="handle" value={addLinkedin} onChange={(e) => setAddLinkedin(e.target.value)}
                        className="flex-1 h-full pr-3 bg-transparent text-sm outline-none" />
                    </div>
                    <div className="flex items-center h-9 rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                      <span className="pl-3 text-xs text-muted-foreground whitespace-nowrap">x.com/</span>
                      <input type="text" placeholder="handle" value={addTwitter} onChange={(e) => setAddTwitter(e.target.value)}
                        className="flex-1 h-full pr-3 bg-transparent text-sm outline-none" />
                    </div>
                    <input type="text" placeholder="Website URL" value={addWebsite} onChange={(e) => setAddWebsite(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Private notes</label>
                  <textarea rows={2} placeholder="Notes only you can see..." value={addNotes} onChange={(e) => setAddNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                </div>

                {customFieldNames.length > 0 && (
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Event fields</p>
                    <div className="space-y-3">
                      {customFieldNames.map((fieldName) => (
                        <div key={fieldName}>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">{fieldName}</label>
                          <textarea rows={2} placeholder={`${fieldName}...`}
                            value={addCustomFields[fieldName] || ""}
                            onChange={(e) => setAddCustomFields((prev) => ({ ...prev, [fieldName]: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {addError && <p className="text-xs text-destructive">{addError}</p>}
              </div>
              <div className="flex gap-2 px-6 py-4 border-t border-border/50 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button type="submit" disabled={addLoading || !addName.trim()} className="flex-1 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                  {addLoading ? "Adding..." : "Add to meetup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {editingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingPerson(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div>
                <h2 className="text-base font-semibold">Edit person</h2>
                {isAdmin && <p className="text-xs text-muted-foreground mt-0.5">Admin — all fields visible</p>}
              </div>
              <button onClick={() => setEditingPerson(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleSaveEdit} className="flex flex-col min-h-0">
              <div className="overflow-y-auto px-6 space-y-4 pb-2">

                {/* ── Core fields (everyone) ── */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Name <span className="text-destructive">*</span></label>
                  <input type="text" required autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>

                {editingPerson._source === "profile" && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Currently building</label>
                    <input type="text" placeholder="What are you working on?" value={editBuilding} onChange={(e) => setEditBuilding(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio / Summary</label>
                  <textarea rows={3} placeholder="Brief summary..." value={editBio} onChange={(e) => setEditBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Skills <span className="font-normal">(comma-separated)</span></label>
                  <input type="text" placeholder="React, AI, Design..." value={editSkills} onChange={(e) => setEditSkills(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Looking for help with</label>
                  <textarea rows={2} placeholder="e.g. Finding customers, fundraising, design feedback..." value={editLookingForHelp} onChange={(e) => setEditLookingForHelp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                </div>

                {/* ── Admin-only fields ── */}
                {isAdmin && editingPerson._source === "community" && (
                  <>
                    <div className="border-t border-border/50 pt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Contact details</p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Company</label>
                            <input type="text" placeholder="Acme Inc." value={editCompany} onChange={(e) => setEditCompany(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                            <input type="text" placeholder="Founder, Engineer..." value={editRole} onChange={(e) => setEditRole(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                          <input type="email" placeholder="their@email.com" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Socials</p>
                      <div className="space-y-3">
                        <div className="flex items-center h-9 rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                          <span className="pl-3 text-xs text-muted-foreground whitespace-nowrap">linkedin.com/in/</span>
                          <input type="text" placeholder="handle" value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)}
                            className="flex-1 h-full pr-3 bg-transparent text-sm outline-none" />
                        </div>
                        <div className="flex items-center h-9 rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                          <span className="pl-3 text-xs text-muted-foreground whitespace-nowrap">x.com/</span>
                          <input type="text" placeholder="handle" value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)}
                            className="flex-1 h-full pr-3 bg-transparent text-sm outline-none" />
                        </div>
                        <input type="text" placeholder="Website URL" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Private notes</label>
                      <textarea rows={3} placeholder="Notes only you can see..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                    </div>
                  </>
                )}

                {isAdmin && editingPerson._source === "profile" && (
                  <>
                    <div className="border-t border-border/50 pt-4 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Socials</p>
                      <div className="flex items-center h-9 rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                        <span className="pl-3 text-xs text-muted-foreground whitespace-nowrap">linkedin.com/in/</span>
                        <input type="text" placeholder="handle" value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)}
                          className="flex-1 h-full pr-3 bg-transparent text-sm outline-none" />
                      </div>
                      <div className="flex items-center h-9 rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                        <span className="pl-3 text-xs text-muted-foreground whitespace-nowrap">x.com/</span>
                        <input type="text" placeholder="handle" value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)}
                          className="flex-1 h-full pr-3 bg-transparent text-sm outline-none" />
                      </div>
                      <input type="text" placeholder="Website URL" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                    </div>
                    <div className="border-t border-border/50 pt-4">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Private notes</label>
                      <textarea rows={3} placeholder="Notes only you can see..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                    </div>
                  </>
                )}

                {/* ── Event-specific custom fields ── */}
                {customFieldNames.length > 0 && (
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Event fields</p>
                    <div className="space-y-3">
                      {customFieldNames.map((fieldName) => (
                        <div key={fieldName}>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">{fieldName}</label>
                          <textarea
                            rows={2}
                            placeholder={`${fieldName}...`}
                            value={editCustomFields[fieldName] || ""}
                            onChange={(e) => setEditCustomFields((prev) => ({ ...prev, [fieldName]: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editError && <p className="text-xs text-destructive">{editError}</p>}
              </div>

              {/* Footer */}
              <div className="flex gap-2 px-6 py-4 border-t border-border/50 shrink-0">
                <button type="button" onClick={() => setEditingPerson(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button type="submit" disabled={editLoading || !editName.trim()} className="flex-1 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                  {editLoading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
