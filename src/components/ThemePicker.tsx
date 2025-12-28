"use client";

import { useState } from 'react';
import { THEMES, getThemesByCategory, ThemeConfig } from '@/lib/themes';

interface ThemePickerProps {
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

/**
 * ThemePicker component
 *
 * Beautiful UI for selecting profile themes, organized by category.
 * Shows live preview of each theme with colors and styles.
 */
export function ThemePicker({ currentThemeId, onSelectTheme }: ThemePickerProps) {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const themesByCategory = getThemesByCategory();

  const categories = [
    { id: 'minimal' as const, label: 'Minimal', emoji: '✨' },
    { id: 'bold' as const, label: 'Bold', emoji: '🔥' },
    { id: 'creative' as const, label: 'Creative', emoji: '🎨' },
    { id: 'professional' as const, label: 'Professional', emoji: '💼' },
  ];

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const themes = themesByCategory[category.id];
        if (themes.length === 0) return null;

        return (
          <div key={category.id}>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span>{category.emoji}</span>
              {category.label}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {themes.map((theme) => {
                const isSelected = theme.id === currentThemeId;
                const isHovered = theme.id === hoveredTheme;

                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    onMouseEnter={() => setHoveredTheme(theme.id)}
                    onMouseLeave={() => setHoveredTheme(null)}
                    className={`group relative rounded-xl p-4 border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-[#F4A261] shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {/* Theme Name */}
                    <div className="mb-3">
                      <div className="font-semibold text-base mb-1">{theme.name}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">{theme.description}</div>
                    </div>

                    {/* Color Preview */}
                    <div className="flex gap-1 mb-3">
                      <div
                        className="w-8 h-8 rounded-md"
                        style={{ background: theme.colors.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-8 h-8 rounded-md"
                        style={{ background: theme.colors.accent }}
                        title="Accent"
                      />
                      <div
                        className="w-8 h-8 rounded-md border border-gray-200"
                        style={{ background: theme.colors.background }}
                        title="Background"
                      />
                    </div>

                    {/* Theme Preview Card */}
                    <div
                      className={`rounded-lg p-3 ${theme.effects.glassEffect ? 'backdrop-blur-sm' : ''}`}
                      style={{
                        backgroundColor: theme.colors.card,
                        borderRadius: theme.effects.cardRadius,
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <div
                        className="text-xs font-semibold mb-1"
                        style={{
                          color: theme.colors.cardForeground,
                          fontFamily: theme.typography.heading,
                        }}
                      >
                        Sample Text
                      </div>
                      <div
                        className="text-[10px]"
                        style={{
                          color: theme.colors.mutedForeground,
                          fontFamily: theme.typography.body,
                        }}
                      >
                        This is how text looks
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#F4A261] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Hover Effect */}
                    {isHovered && !isSelected && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-orange-500/5 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="font-medium mb-1">Your theme will be applied to your public profile</div>
            <div className="text-blue-700 text-xs">
              Choose a theme that matches your personal brand. You can change it anytime!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
