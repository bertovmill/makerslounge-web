"use client";

import { useState, KeyboardEvent } from "react";

interface SkillsInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
  showQuickSelect?: boolean;
  mode?: "skills" | "looking_for";
}

// Quick-select categories for your superpowers/skills
const SKILLS_CATEGORIES = [
  {
    label: "Tech",
    skills: ["AI/ML", "Web Dev", "Mobile Dev", "Backend", "Frontend", "DevOps", "Data Science", "Blockchain"],
  },
  {
    label: "Creative",
    skills: ["Design", "UX/UI", "Video", "Photography", "Writing", "Music", "Animation", "Branding"],
  },
  {
    label: "Business",
    skills: ["Marketing", "Sales", "Growth", "Product", "Strategy", "Finance", "Operations", "Fundraising"],
  },
  {
    label: "Other",
    skills: ["Community", "Podcasting", "Public Speaking", "Consulting", "Research", "Education"],
  },
];

// Quick-select categories for who you want to meet
const LOOKING_FOR_CATEGORIES = [
  {
    label: "Builders",
    skills: ["Technical Co-founder", "Developer", "Designer", "Engineer", "No-code Builder"],
  },
  {
    label: "Business",
    skills: ["Business Co-founder", "Marketer", "Sales Expert", "Growth Hacker", "Ops/Finance"],
  },
  {
    label: "Creators",
    skills: ["Content Creator", "Copywriter", "Video Producer", "Podcaster", "Community Builder"],
  },
  {
    label: "Advisors",
    skills: ["Mentor", "Investor", "Industry Expert", "Startup Advisor", "Domain Expert"],
  },
];

// Flat list for autocomplete (combines both)
const SKILL_SUGGESTIONS = [
  ...SKILLS_CATEGORIES.flatMap((cat) => cat.skills),
  ...LOOKING_FOR_CATEGORIES.flatMap((cat) => cat.skills),
];

export default function SkillsInput({
  skills,
  onChange,
  maxSkills = 10,
  showQuickSelect = true,
  mode = "skills",
}: SkillsInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categories = mode === "looking_for" ? LOOKING_FOR_CATEGORIES : SKILLS_CATEGORIES;

  const filteredSuggestions = SKILL_SUGGESTIONS.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !skills.includes(s)
  );

  const isSelected = (skill: string) => skills.includes(skill);
  const canAddMore = skills.length < maxSkills;

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < maxSkills) {
      onChange([...skills, trimmed]);
      setInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(input);
    } else if (e.key === "Backspace" && !input && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  return (
    <div className="relative">
      {/* Current skills as tags */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 bg-primary/15 text-primary px-3 py-1 rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="hover:opacity-70"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowSuggestions(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        placeholder={skills.length >= maxSkills ? "Max skills reached" : "Type a skill and press Enter..."}
        disabled={skills.length >= maxSkills}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && input && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSkill(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary first:rounded-t-lg last:rounded-b-lg"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        {skills.length}/{maxSkills} skills - Press Enter or comma to add
      </p>

      {/* Quick-select pills */}
      {showQuickSelect && (
        <div className="mt-4 space-y-3">
          {categories.map((category) => (
            <div key={category.label}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{category.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {category.skills.map((skill) => {
                  const selected = isSelected(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          removeSkill(skill);
                        } else if (canAddMore) {
                          addSkill(skill);
                        }
                      }}
                      disabled={!selected && !canAddMore}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        selected
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-card border-border text-muted-foreground hover:border-muted-foreground/40 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                      }`}
                    >
                      {selected && (
                        <span className="mr-1">✓</span>
                      )}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
