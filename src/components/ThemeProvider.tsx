"use client";

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { Theme, ThemeConfig, getTheme } from '@/lib/themes';

interface ThemeContextValue {
  theme: Theme;
  themeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  themeConfig: ThemeConfig;
  children: ReactNode;
}

/**
 * ThemeProvider component
 *
 * Provides theme context and injects CSS variables for the current theme.
 * Prevents layout shift by setting variables before first paint.
 */
export function ThemeProvider({ themeConfig, children }: ThemeProviderProps) {
  const theme = getTheme(themeConfig.theme_id);

  useEffect(() => {
    // Inject CSS variables into document root
    const root = document.documentElement;

    // Colors
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-primary-foreground', theme.colors.primaryForeground);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-accent-foreground', theme.colors.accentForeground);
    root.style.setProperty('--theme-bg', theme.colors.background);
    root.style.setProperty('--theme-fg', theme.colors.foreground);
    root.style.setProperty('--theme-card', theme.colors.card);
    root.style.setProperty('--theme-card-foreground', theme.colors.cardForeground);
    root.style.setProperty('--theme-muted', theme.colors.muted);
    root.style.setProperty('--theme-muted-foreground', theme.colors.mutedForeground);
    root.style.setProperty('--theme-border', theme.colors.border);
    root.style.setProperty('--theme-ring', theme.colors.ring);

    // Typography
    root.style.setProperty('--theme-font-heading', theme.typography.heading);
    root.style.setProperty('--theme-font-body', theme.typography.body);
    root.style.setProperty('--theme-font-scale', theme.typography.scale.toString());

    // Spacing
    root.style.setProperty('--theme-spacing-scale', theme.spacing.scale.toString());

    // Effects
    root.style.setProperty('--theme-card-radius', theme.effects.cardRadius);
    root.style.setProperty('--theme-shadow-style', theme.effects.shadowStyle);

    if (theme.effects.gradientStyle) {
      root.style.setProperty('--theme-gradient', theme.effects.gradientStyle);
    }

    // Cleanup on unmount
    return () => {
      root.style.removeProperty('--theme-primary');
      root.style.removeProperty('--theme-primary-foreground');
      root.style.removeProperty('--theme-accent');
      root.style.removeProperty('--theme-accent-foreground');
      root.style.removeProperty('--theme-bg');
      root.style.removeProperty('--theme-fg');
      root.style.removeProperty('--theme-card');
      root.style.removeProperty('--theme-card-foreground');
      root.style.removeProperty('--theme-muted');
      root.style.removeProperty('--theme-muted-foreground');
      root.style.removeProperty('--theme-border');
      root.style.removeProperty('--theme-ring');
      root.style.removeProperty('--theme-font-heading');
      root.style.removeProperty('--theme-font-body');
      root.style.removeProperty('--theme-font-scale');
      root.style.removeProperty('--theme-spacing-scale');
      root.style.removeProperty('--theme-card-radius');
      root.style.removeProperty('--theme-shadow-style');
      root.style.removeProperty('--theme-gradient');
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access current theme
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Get shadow className based on theme shadow style
 */
export function getThemeShadow(shadowStyle: Theme['effects']['shadowStyle']): string {
  switch (shadowStyle) {
    case 'soft':
      return 'shadow-lg shadow-black/5';
    case 'sharp':
      return 'shadow-md shadow-black/20';
    case 'none':
      return '';
    default:
      return 'shadow-sm';
  }
}
