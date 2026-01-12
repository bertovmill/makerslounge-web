// Brand storage utility - uses localStorage, easy to swap for DB later

export interface BrandConfig {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  logoUrl?: string;
  style: "minimal" | "bold" | "playful" | "professional";
}

const STORAGE_KEY = "makerslounge_brand_config";

export const defaultBrand: BrandConfig = {
  name: "My Brand",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  backgroundColor: "#0f0f0f",
  textColor: "#ffffff",
  accentColor: "#f59e0b",
  fontHeading: "Inter",
  fontBody: "Inter",
  style: "minimal",
};

export function saveBrand(config: BrandConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function loadBrand(): BrandConfig {
  if (typeof window === "undefined") return defaultBrand;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultBrand;
  try {
    return { ...defaultBrand, ...JSON.parse(stored) };
  } catch {
    return defaultBrand;
  }
}

export function clearBrand(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// Available fonts (Google Fonts we'll load)
export const availableFonts = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Oswald",
  "Raleway",
  "Space Grotesk",
  "DM Sans",
];
