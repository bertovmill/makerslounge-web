// Preset cover image gradients for profiles
export const PRESET_COVERS = [
  {
    id: "gradient-sunset",
    name: "Sunset",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    id: "gradient-ocean",
    name: "Ocean",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    id: "gradient-forest",
    name: "Forest",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  {
    id: "gradient-fire",
    name: "Fire",
    gradient: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
  },
  {
    id: "gradient-royal",
    name: "Royal",
    gradient: "linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)",
  },
  {
    id: "gradient-coral",
    name: "Coral",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  },
  {
    id: "gradient-midnight",
    name: "Midnight",
    gradient: "linear-gradient(135deg, #232526 0%, #414345 100%)",
  },
  {
    id: "gradient-aurora",
    name: "Aurora",
    gradient: "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
  },
  {
    id: "gradient-warm",
    name: "Warm",
    gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  },
  {
    id: "gradient-lavender",
    name: "Lavender",
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  },
  {
    id: "gradient-mint",
    name: "Mint",
    gradient: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  },
  {
    id: "gradient-space",
    name: "Space",
    gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  },
];

export function getCoverStyle(coverImage: string | null): React.CSSProperties {
  if (!coverImage) {
    // Default gradient
    return {
      background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    };
  }

  // Check if it's a preset gradient ID
  const preset = PRESET_COVERS.find((p) => p.id === coverImage);
  if (preset) {
    return {
      background: preset.gradient,
    };
  }

  // Otherwise, it's a custom image URL
  return {
    backgroundImage: `url(${coverImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
