/**
 * Portfolio Theme System
 *
 * Defines 7 beautiful preset themes for MakersLounge profiles.
 * Each theme controls colors, typography, spacing, and effects.
 */

export type ThemeCategory = 'minimal' | 'bold' | 'creative' | 'professional';
export type ShadowStyle = 'soft' | 'sharp' | 'none';

export interface Theme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  colors: {
    // Primary colors (OKLCH for superior color rendering)
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;

    // Base colors
    background: string;
    foreground: string;

    // Component colors
    card: string;
    cardForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;

    // Semantic colors
    ring: string;
  };
  typography: {
    heading: string;    // Font family for headings
    body: string;       // Font family for body text
    scale: number;      // Size multiplier (1.0 = base)
  };
  spacing: {
    scale: number;      // Spacing multiplier (1.0 = base)
  };
  effects: {
    cardRadius: string;               // Border radius for cards
    shadowStyle: ShadowStyle;         // Shadow aesthetic
    gradientStyle?: string;           // Optional gradient overlay
    glassEffect: boolean;             // Enable glassmorphism
  };
}

export interface ThemeConfig {
  theme_id: string;
  sections?: Record<string, any>;      // Phase 2: section visibility/order
  custom_sections?: any[];             // Phase 3: custom blocks
  custom_colors?: Record<string, string>;  // Phase 2: color overrides
}

/**
 * All available themes
 */
export const THEMES: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'MakersLounge',
    description: 'Warm, welcoming design with coral accents',
    category: 'creative',
    colors: {
      primary: 'oklch(0.5 0.2 255)',           // Royal blue
      primaryForeground: 'oklch(0.95 0 0)',    // White
      accent: 'oklch(0.7 0.18 50)',            // Warm orange/coral
      accentForeground: 'oklch(0.15 0.02 260)', // Dark
      background: 'oklch(0.985 0.005 250)',    // Off-white
      foreground: 'oklch(0.2 0.02 260)',       // Deep blue-black
      card: 'oklch(1 0 0)',                    // Pure white
      cardForeground: 'oklch(0.2 0.02 260)',   // Deep blue-black
      muted: 'oklch(0.96 0.005 250)',          // Light gray
      mutedForeground: 'oklch(0.45 0.01 260)', // Medium gray
      border: 'oklch(0.92 0.005 250)',         // Border gray
      ring: 'oklch(0.5 0.2 255)',              // Royal blue
    },
    typography: {
      heading: '"Space Grotesk", sans-serif',
      body: '"Space Grotesk", sans-serif',
      scale: 1.0,
    },
    spacing: {
      scale: 1.0,
    },
    effects: {
      cardRadius: '1rem',
      shadowStyle: 'soft',
      gradientStyle: 'linear-gradient(135deg, oklch(0.5 0.2 255), oklch(0.6 0.15 195), oklch(0.7 0.18 50))',
      glassEffect: true,
    },
  },

  claude: {
    id: 'claude',
    name: 'Claude',
    description: 'Elegant serif typography with refined cream tones',
    category: 'professional',
    colors: {
      primary: 'oklch(0.35 0.05 40)',          // Deep warm brown
      primaryForeground: 'oklch(0.98 0.01 40)', // Cream white
      accent: 'oklch(0.65 0.12 50)',           // Warm terracotta
      accentForeground: 'oklch(0.98 0.01 40)', // Cream white
      background: 'oklch(0.98 0.01 40)',       // Warm cream
      foreground: 'oklch(0.25 0.02 40)',       // Rich brown-black
      card: 'oklch(0.99 0.005 40)',            // Bright cream
      cardForeground: 'oklch(0.25 0.02 40)',   // Rich brown-black
      muted: 'oklch(0.94 0.01 40)',            // Muted cream
      mutedForeground: 'oklch(0.5 0.02 40)',   // Medium brown
      border: 'oklch(0.88 0.015 40)',          // Warm border
      ring: 'oklch(0.65 0.12 50)',             // Terracotta
    },
    typography: {
      heading: '"Syne", sans-serif',
      body: '"Space Grotesk", sans-serif',
      scale: 1.05,
    },
    spacing: {
      scale: 1.1,
    },
    effects: {
      cardRadius: '0.5rem',
      shadowStyle: 'soft',
      glassEffect: false,
    },
  },

  linear: {
    id: 'linear',
    name: 'Linear',
    description: 'Sharp, minimal design with high contrast',
    category: 'minimal',
    colors: {
      primary: 'oklch(0.25 0 0)',              // Pure black
      primaryForeground: 'oklch(1 0 0)',       // Pure white
      accent: 'oklch(0.5 0.25 265)',           // Vibrant purple
      accentForeground: 'oklch(1 0 0)',        // Pure white
      background: 'oklch(1 0 0)',              // Pure white
      foreground: 'oklch(0.15 0 0)',           // Near black
      card: 'oklch(0.99 0 0)',                 // Off-white
      cardForeground: 'oklch(0.15 0 0)',       // Near black
      muted: 'oklch(0.96 0 0)',                // Light gray
      mutedForeground: 'oklch(0.5 0 0)',       // Medium gray
      border: 'oklch(0.9 0 0)',                // Border gray
      ring: 'oklch(0.25 0 0)',                 // Black
    },
    typography: {
      heading: '"Space Grotesk", sans-serif',
      body: '"Space Grotesk", sans-serif',
      scale: 0.98,
    },
    spacing: {
      scale: 0.9,
    },
    effects: {
      cardRadius: '0.375rem',
      shadowStyle: 'sharp',
      glassEffect: false,
    },
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Bold gradients with vibrant warm colors',
    category: 'bold',
    colors: {
      primary: 'oklch(0.6 0.22 30)',           // Warm red-orange
      primaryForeground: 'oklch(0.98 0.01 30)', // Warm white
      accent: 'oklch(0.75 0.18 70)',           // Golden yellow
      accentForeground: 'oklch(0.2 0.02 30)',  // Dark warm
      background: 'oklch(0.97 0.02 30)',       // Warm off-white
      foreground: 'oklch(0.25 0.03 30)',       // Deep warm brown
      card: 'oklch(0.99 0.01 30)',             // Bright warm white
      cardForeground: 'oklch(0.25 0.03 30)',   // Deep warm brown
      muted: 'oklch(0.93 0.02 30)',            // Warm muted
      mutedForeground: 'oklch(0.5 0.03 30)',   // Medium warm
      border: 'oklch(0.87 0.03 30)',           // Warm border
      ring: 'oklch(0.6 0.22 30)',              // Warm red-orange
    },
    typography: {
      heading: '"Syne", sans-serif',
      body: '"Space Grotesk", sans-serif',
      scale: 1.08,
    },
    spacing: {
      scale: 1.05,
    },
    effects: {
      cardRadius: '1.25rem',
      shadowStyle: 'soft',
      gradientStyle: 'linear-gradient(135deg, oklch(0.6 0.22 30), oklch(0.7 0.2 50), oklch(0.8 0.15 70))',
      glassEffect: true,
    },
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy greens with an organic, calm feel',
    category: 'creative',
    colors: {
      primary: 'oklch(0.45 0.12 155)',         // Forest green
      primaryForeground: 'oklch(0.98 0.01 155)', // Light green-white
      accent: 'oklch(0.65 0.15 130)',          // Sage green
      accentForeground: 'oklch(0.15 0.02 155)', // Dark green
      background: 'oklch(0.97 0.01 140)',      // Warm green-white
      foreground: 'oklch(0.25 0.03 155)',      // Deep green-black
      card: 'oklch(0.99 0.005 140)',           // Bright warm white
      cardForeground: 'oklch(0.25 0.03 155)',  // Deep green-black
      muted: 'oklch(0.93 0.015 140)',          // Light sage
      mutedForeground: 'oklch(0.5 0.04 155)',  // Medium green
      border: 'oklch(0.87 0.02 140)',          // Green-tinted border
      ring: 'oklch(0.45 0.12 155)',            // Forest green
    },
    typography: {
      heading: '"Space Grotesk", sans-serif',
      body: '"Space Grotesk", sans-serif',
      scale: 1.0,
    },
    spacing: {
      scale: 1.05,
    },
    effects: {
      cardRadius: '1rem',
      shadowStyle: 'soft',
      gradientStyle: 'linear-gradient(135deg, oklch(0.45 0.12 155), oklch(0.55 0.13 140), oklch(0.65 0.15 130))',
      glassEffect: true,
    },
  },

  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark and sleek with neon accents',
    category: 'bold',
    colors: {
      primary: 'oklch(0.6 0.25 265)',          // Neon purple
      primaryForeground: 'oklch(0.95 0 0)',    // White
      accent: 'oklch(0.7 0.22 190)',           // Neon cyan
      accentForeground: 'oklch(0.15 0.015 255)', // Dark blue
      background: 'oklch(0.12 0.015 255)',     // Dark blue-black
      foreground: 'oklch(0.95 0 0)',           // White
      card: 'oklch(0.18 0.02 255)',            // Dark blue card
      cardForeground: 'oklch(0.95 0 0)',       // White
      muted: 'oklch(0.25 0.02 255)',           // Muted dark blue
      mutedForeground: 'oklch(0.65 0.01 255)', // Light blue-gray
      border: 'oklch(0.3 0.03 255)',           // Blue-tinted border
      ring: 'oklch(0.6 0.25 265)',             // Neon purple
    },
    typography: {
      heading: '"Space Grotesk", sans-serif',
      body: '"Space Grotesk", sans-serif',
      scale: 1.02,
    },
    spacing: {
      scale: 1.0,
    },
    effects: {
      cardRadius: '0.75rem',
      shadowStyle: 'sharp',
      gradientStyle: 'linear-gradient(135deg, oklch(0.15 0.02 265), oklch(0.2 0.03 255), oklch(0.18 0.025 245))',
      glassEffect: true,
    },
  },

  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Ultra-minimal black and white with strong typography',
    category: 'minimal',
    colors: {
      primary: 'oklch(0.2 0 0)',               // Dark gray
      primaryForeground: 'oklch(0.98 0 0)',    // Off-white
      accent: 'oklch(0.4 0 0)',                // Medium gray
      accentForeground: 'oklch(0.98 0 0)',     // Off-white
      background: 'oklch(0.98 0 0)',           // Off-white
      foreground: 'oklch(0.15 0 0)',           // Near black
      card: 'oklch(1 0 0)',                    // Pure white
      cardForeground: 'oklch(0.15 0 0)',       // Near black
      muted: 'oklch(0.94 0 0)',                // Light gray
      mutedForeground: 'oklch(0.5 0 0)',       // Medium gray
      border: 'oklch(0.85 0 0)',               // Border gray
      ring: 'oklch(0.2 0 0)',                  // Dark gray
    },
    typography: {
      heading: '"Syne", sans-serif',
      body: '"Space Grotesk", sans-serif',
      scale: 1.12,
    },
    spacing: {
      scale: 1.15,
    },
    effects: {
      cardRadius: '0',
      shadowStyle: 'none',
      glassEffect: false,
    },
  },
};

/**
 * Get theme by ID, with fallback to default
 */
export function getTheme(themeId?: string): Theme {
  if (!themeId || !THEMES[themeId]) {
    return THEMES.default;
  }
  return THEMES[themeId];
}

/**
 * Get themes grouped by category
 */
export function getThemesByCategory(): Record<ThemeCategory, Theme[]> {
  const grouped: Record<ThemeCategory, Theme[]> = {
    minimal: [],
    bold: [],
    creative: [],
    professional: [],
  };

  Object.values(THEMES).forEach((theme) => {
    grouped[theme.category].push(theme);
  });

  return grouped;
}

/**
 * Get default theme config for new users
 */
export function getDefaultThemeConfig(): ThemeConfig {
  return {
    theme_id: 'default',
  };
}
