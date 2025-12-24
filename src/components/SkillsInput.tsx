"use client";

import { useState, KeyboardEvent } from "react";

interface SkillsInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
}

const SKILL_SUGGESTIONS = [
  "AI", "Machine Learning", "Web Dev", "Mobile Dev", "Design", "UX/UI",
  "Marketing", "Sales", "Finance", "E-commerce", "Community", "Podcasting",
  "Product", "Data Science", "Blockchain", "Growth", "Content", "Video",
  "Writing", "Photography", "Music", "Gaming", "Health", "Education"
];

export default function SkillsInput({
  skills,
  onChange,
  maxSkills = 10,
}: SkillsInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = SKILL_SUGGESTIONS.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !skills.includes(s)
  );

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
              className="inline-flex items-center gap-1 bg-[#F4A261]/20 text-[#c77f4a] px-3 py-1 rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="hover:text-[#a66b3d]"
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
        className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-gray-400"
        placeholder={skills.length >= maxSkills ? "Max skills reached" : "Type a skill and press Enter..."}
        disabled={skills.length >= maxSkills}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && input && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSkill(suggestion)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-1">
        {skills.length}/{maxSkills} skills - Press Enter or comma to add
      </p>
    </div>
  );
}
