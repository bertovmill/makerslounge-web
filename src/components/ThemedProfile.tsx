"use client";

import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { ThemeConfig, getDefaultThemeConfig } from '@/lib/themes';

interface ThemedProfileProps {
  themeConfig?: ThemeConfig | null;
  children: ReactNode;
}

/**
 * ThemedProfile wrapper component
 *
 * Wraps profile pages with theme provider, applying user's theme preferences.
 * Falls back to default theme if no theme config is provided.
 */
export function ThemedProfile({ themeConfig, children }: ThemedProfileProps) {
  const config = themeConfig || getDefaultThemeConfig();

  return (
    <ThemeProvider themeConfig={config}>
      <div
        className="themed-profile"
        style={{
          backgroundColor: 'var(--theme-bg)',
          color: 'var(--theme-fg)',
          fontFamily: 'var(--theme-font-body)',
        }}
      >
        {children}
      </div>
    </ThemeProvider>
  );
}
