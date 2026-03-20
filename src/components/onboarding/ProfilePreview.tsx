"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SkillsInput from "@/components/SkillsInput";
import { ArrowLeft, Check, Pencil } from "lucide-react";

export interface ProfileData {
  firstName: string;
  lastName: string;
  projects: string[];
  skills: string[];
  lookingForSkills: string[];
  linkedin: string;
  twitter: string;
  instagram: string;
  website: string;
}

interface ProfilePreviewProps {
  data: ProfileData;
  userId: string;
  onBack?: () => void;
}

export default function ProfilePreview({ data, userId, onBack }: ProfilePreviewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(data);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: profile.firstName.trim(),
        last_name: profile.lastName.trim(),
        name: `${profile.firstName.trim()} ${profile.lastName.trim()}`,
        currently_building: JSON.stringify(profile.projects.filter(p => p.trim())),
        skills: profile.skills,
        looking_for_skills: profile.lookingForSkills,
        linkedin: profile.linkedin.trim() ? (profile.linkedin.startsWith("http") ? profile.linkedin.trim() : `https://linkedin.com/in/${profile.linkedin.trim()}`) : null,
        twitter: profile.twitter.trim() ? (profile.twitter.startsWith("http") ? profile.twitter.trim() : `https://x.com/${profile.twitter.trim()}`) : null,
        instagram: profile.instagram.trim() ? (profile.instagram.startsWith("http") ? profile.instagram.trim() : `https://instagram.com/${profile.instagram.trim()}`) : null,
        website: profile.website.trim() ? (profile.website.startsWith("http") ? profile.website.trim() : `https://${profile.website.trim()}`) : null,
        onboarding_completed: true,
      });
      if (error) throw error;
      router.push("/people");
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaving(false);
    }
  };

  const toggleEdit = (section: string) => {
    setEditingSection(editingSection === section ? null : section);
  };

  return (
    <div className="min-h-svh flex items-start md:items-center justify-center px-4 py-12">
      <div className="w-full max-w-md md:max-w-lg">
        <h1 className="text-[24px] md:text-2xl font-bold md:font-semibold tracking-tight mb-1">
          Here&apos;s your profile
        </h1>
        <p className="text-[13px] md:text-sm text-muted-foreground mb-6">
          Review and edit anything before we save it.
        </p>

        <div className="space-y-4 mb-8">
          {/* Name */}
          <Section
            title="Name"
            isEditing={editingSection === "name"}
            onToggle={() => toggleEdit("name")}
          >
            {editingSection === "name" ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                  placeholder="First name"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                  placeholder="Last name"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ) : (
              <p className="text-sm">{profile.firstName} {profile.lastName}</p>
            )}
          </Section>

          {/* Projects */}
          <Section
            title="Building"
            isEditing={editingSection === "projects"}
            onToggle={() => toggleEdit("projects")}
          >
            {editingSection === "projects" ? (
              <div className="space-y-2">
                {profile.projects.map((project, i) => (
                  <input
                    key={i}
                    type="text"
                    value={project}
                    onChange={e => {
                      const updated = [...profile.projects];
                      updated[i] = e.target.value;
                      setProfile({ ...profile, projects: updated });
                    }}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                ))}
              </div>
            ) : (
              <ul className="text-sm space-y-1">
                {profile.projects.filter(p => p.trim()).map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
                {profile.projects.filter(p => p.trim()).length === 0 && (
                  <li className="text-muted-foreground italic">No projects yet</li>
                )}
              </ul>
            )}
          </Section>

          {/* Skills */}
          <Section
            title="Skills"
            isEditing={editingSection === "skills"}
            onToggle={() => toggleEdit("skills")}
          >
            {editingSection === "skills" ? (
              <SkillsInput skills={profile.skills} onChange={skills => setProfile({ ...profile, skills })} maxSkills={10} />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map(s => (
                  <span key={s} className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-full text-xs">{s}</span>
                ))}
                {profile.skills.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">None selected</span>
                )}
              </div>
            )}
          </Section>

          {/* Looking for */}
          <Section
            title="Looking for"
            isEditing={editingSection === "lookingFor"}
            onToggle={() => toggleEdit("lookingFor")}
          >
            {editingSection === "lookingFor" ? (
              <SkillsInput skills={profile.lookingForSkills} onChange={lookingForSkills => setProfile({ ...profile, lookingForSkills })} maxSkills={10} mode="looking_for" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.lookingForSkills.map(s => (
                  <span key={s} className="bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full text-xs">{s}</span>
                ))}
                {profile.lookingForSkills.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">None selected</span>
                )}
              </div>
            )}
          </Section>

          {/* Socials */}
          <Section
            title="Social links"
            isEditing={editingSection === "socials"}
            onToggle={() => toggleEdit("socials")}
          >
            {editingSection === "socials" ? (
              <div className="space-y-2">
                {[
                  { label: "LinkedIn", prefix: "linkedin.com/in/", value: profile.linkedin, key: "linkedin" as const },
                  { label: "X", prefix: "x.com/", value: profile.twitter, key: "twitter" as const },
                  { label: "Instagram", prefix: "instagram.com/", value: profile.instagram, key: "instagram" as const },
                  { label: "Website", prefix: "https://", value: profile.website, key: "website" as const },
                ].map(field => (
                  <div key={field.label} className="flex items-center h-10 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                    <span className="text-xs text-muted-foreground pl-3 pr-1 shrink-0">{field.prefix}</span>
                    <input
                      type="text"
                      value={field.value}
                      onChange={e => setProfile({ ...profile, [field.key]: e.target.value })}
                      placeholder="username"
                      className="flex-1 h-full pr-3 text-sm outline-none bg-transparent"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm space-y-0.5">
                {profile.linkedin && <p>LinkedIn: {profile.linkedin}</p>}
                {profile.twitter && <p>X: {profile.twitter}</p>}
                {profile.instagram && <p>Instagram: {profile.instagram}</p>}
                {profile.website && <p>Website: {profile.website}</p>}
                {!profile.linkedin && !profile.twitter && !profile.instagram && !profile.website && (
                  <p className="text-muted-foreground italic">No links added</p>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="h-11 md:h-10 px-4 rounded-xl md:rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !profile.firstName.trim()}
            className="flex-1 h-11 md:h-10 rounded-xl md:rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? "Saving..." : "Looks good!"}
            {!saving && <Check className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  isEditing,
  onToggle,
  children,
}: {
  title: string;
  isEditing: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}
