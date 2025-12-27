"use client";

import { useState } from "react";

interface AvatarOption {
  id: string;
  name: string;
  type: "gradient" | "pattern" | "character";
  colors?: string[];
  pattern?: string;
  emoji?: string;
}

const avatarOptions: AvatarOption[] = [
  // Fun gradients
  { id: "sunset", name: "Sunset", type: "gradient", colors: ["#FF6B6B", "#FFE66D"] },
  { id: "ocean", name: "Ocean", type: "gradient", colors: ["#667eea", "#764ba2"] },
  { id: "mint", name: "Mint", type: "gradient", colors: ["#11998e", "#38ef7d"] },
  { id: "peach", name: "Peach", type: "gradient", colors: ["#ee9ca7", "#ffdde1"] },
  { id: "lavender", name: "Lavender", type: "gradient", colors: ["#a18cd1", "#fbc2eb"] },
  { id: "fire", name: "Fire", type: "gradient", colors: ["#f12711", "#f5af19"] },
  { id: "berry", name: "Berry", type: "gradient", colors: ["#8E2DE2", "#4A00E0"] },
  { id: "coral", name: "Coral", type: "gradient", colors: ["#F4A261", "#E76F51"] },

  // Fun patterns
  { id: "zigzag", name: "Zigzag", type: "pattern", pattern: "zigzag", colors: ["#FF6B6B", "#4ECDC4"] },
  { id: "dots", name: "Dots", type: "pattern", pattern: "dots", colors: ["#6C5CE7", "#A29BFE"] },
  { id: "waves", name: "Waves", type: "pattern", pattern: "waves", colors: ["#00B4DB", "#0083B0"] },
  { id: "stripes", name: "Stripes", type: "pattern", pattern: "stripes", colors: ["#F093FB", "#F5576C"] },

  // Fun character avatars (emoji-based)
  { id: "robot", name: "Robot", type: "character", emoji: "🤖", colors: ["#74b9ff", "#0984e3"] },
  { id: "alien", name: "Alien", type: "character", emoji: "👽", colors: ["#a29bfe", "#6c5ce7"] },
  { id: "astronaut", name: "Astronaut", type: "character", emoji: "🧑‍🚀", colors: ["#2d3436", "#636e72"] },
  { id: "unicorn", name: "Unicorn", type: "character", emoji: "🦄", colors: ["#fd79a8", "#e84393"] },
  { id: "rocket", name: "Rocket", type: "character", emoji: "🚀", colors: ["#fdcb6e", "#f39c12"] },
  { id: "star", name: "Star", type: "character", emoji: "⭐", colors: ["#ffeaa7", "#fdcb6e"] },
  { id: "lightning", name: "Lightning", type: "character", emoji: "⚡", colors: ["#f9ca24", "#f0932b"] },
  { id: "gem", name: "Gem", type: "character", emoji: "💎", colors: ["#74b9ff", "#0984e3"] },
];

interface AvatarPickerProps {
  selectedAvatar: string | null;
  name: string;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
}

// Helper to render avatar preview
export function renderAvatar(
  avatarId: string | null | undefined,
  name: string,
  size: "sm" | "md" | "lg" | "xl" = "md"
) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-24 h-24 text-2xl",
    xl: "w-32 h-32 text-4xl",
  };

  const avatar = avatarOptions.find((a) => a.id === avatarId);
  const initial = name?.charAt(0).toUpperCase() || "?";

  if (!avatar) {
    // Default gradient with initial
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold`}
      >
        {initial}
      </div>
    );
  }

  const gradientStyle = avatar.colors
    ? { background: `linear-gradient(135deg, ${avatar.colors[0]}, ${avatar.colors[1]})` }
    : {};

  if (avatar.type === "character") {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center`}
        style={gradientStyle}
      >
        <span className={size === "xl" ? "text-5xl" : size === "lg" ? "text-4xl" : size === "md" ? "text-2xl" : "text-lg"}>
          {avatar.emoji}
        </span>
      </div>
    );
  }

  if (avatar.type === "pattern") {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden relative`}
        style={gradientStyle}
      >
        <PatternOverlay pattern={avatar.pattern || ""} />
        <span className="relative z-10 text-white font-bold drop-shadow-md">{initial}</span>
      </div>
    );
  }

  // Gradient type
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold`}
      style={gradientStyle}
    >
      {initial}
    </div>
  );
}

function PatternOverlay({ pattern }: { pattern: string }) {
  if (pattern === "zigzag") {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
        <pattern id="zigzag" patternUnits="userSpaceOnUse" width="20" height="20">
          <path d="M0 10 L5 0 L10 10 L15 0 L20 10" stroke="white" strokeWidth="2" fill="none" />
        </pattern>
        <rect width="100" height="100" fill="url(#zigzag)" />
      </svg>
    );
  }

  if (pattern === "dots") {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100">
        <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="10" cy="10" r="3" fill="white" />
        </pattern>
        <rect width="100" height="100" fill="url(#dots)" />
      </svg>
    );
  }

  if (pattern === "waves") {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
        <pattern id="waves" patternUnits="userSpaceOnUse" width="40" height="20">
          <path d="M0 10 Q10 0 20 10 T40 10" stroke="white" strokeWidth="2" fill="none" />
        </pattern>
        <rect width="100" height="100" fill="url(#waves)" />
      </svg>
    );
  }

  if (pattern === "stripes") {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
        <pattern id="stripes" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
          <rect width="5" height="10" fill="white" />
        </pattern>
        <rect width="100" height="100" fill="url(#stripes)" />
      </svg>
    );
  }

  return null;
}

export default function AvatarPicker({ selectedAvatar, name, onSelect, onClose }: AvatarPickerProps) {
  const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Choose Your Avatar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-8">
          <div className="text-center">
            {renderAvatar(hoveredAvatar || selectedAvatar, name, "xl")}
            <p className="mt-2 text-sm text-gray-500">
              {hoveredAvatar
                ? avatarOptions.find((a) => a.id === hoveredAvatar)?.name
                : selectedAvatar
                ? avatarOptions.find((a) => a.id === selectedAvatar)?.name
                : "Default"}
            </p>
          </div>
        </div>

        {/* Gradient Options */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Gradients</h3>
          <div className="grid grid-cols-4 gap-3">
            {avatarOptions
              .filter((a) => a.type === "gradient")
              .map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => onSelect(avatar.id)}
                  onMouseEnter={() => setHoveredAvatar(avatar.id)}
                  onMouseLeave={() => setHoveredAvatar(null)}
                  className={`relative rounded-full p-1 transition-all ${
                    selectedAvatar === avatar.id
                      ? "ring-2 ring-offset-2 ring-[#F4A261]"
                      : "hover:scale-110"
                  }`}
                >
                  {renderAvatar(avatar.id, name, "md")}
                </button>
              ))}
          </div>
        </div>

        {/* Pattern Options */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Patterns</h3>
          <div className="grid grid-cols-4 gap-3">
            {avatarOptions
              .filter((a) => a.type === "pattern")
              .map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => onSelect(avatar.id)}
                  onMouseEnter={() => setHoveredAvatar(avatar.id)}
                  onMouseLeave={() => setHoveredAvatar(null)}
                  className={`relative rounded-full p-1 transition-all ${
                    selectedAvatar === avatar.id
                      ? "ring-2 ring-offset-2 ring-[#F4A261]"
                      : "hover:scale-110"
                  }`}
                >
                  {renderAvatar(avatar.id, name, "md")}
                </button>
              ))}
          </div>
        </div>

        {/* Character Options */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Fun Characters</h3>
          <div className="grid grid-cols-4 gap-3">
            {avatarOptions
              .filter((a) => a.type === "character")
              .map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => onSelect(avatar.id)}
                  onMouseEnter={() => setHoveredAvatar(avatar.id)}
                  onMouseLeave={() => setHoveredAvatar(null)}
                  className={`relative rounded-full p-1 transition-all ${
                    selectedAvatar === avatar.id
                      ? "ring-2 ring-offset-2 ring-[#F4A261]"
                      : "hover:scale-110"
                  }`}
                >
                  {renderAvatar(avatar.id, name, "md")}
                </button>
              ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-gray-300 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-[#1a1a1a] text-white font-medium hover:bg-[#333] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
