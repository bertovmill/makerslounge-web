"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BrandConfig,
  defaultBrand,
  loadBrand,
  saveBrand,
  availableFonts,
} from "@/lib/brand-storage";
import { cn } from "@/lib/utils";

export default function BrandSetupPage() {
  const router = useRouter();
  const [brand, setBrand] = useState<BrandConfig>(defaultBrand);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBrand(loadBrand());
  }, []);

  const updateBrand = (updates: Partial<BrandConfig>) => {
    setBrand((prev) => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const handleSave = () => {
    saveBrand(brand);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAndContinue = () => {
    saveBrand(brand);
    router.push("/video-editing/brand-studio");
  };

  const styles: { value: BrandConfig["style"]; label: string; description: string }[] = [
    { value: "minimal", label: "Minimal", description: "Clean, simple, lots of whitespace" },
    { value: "bold", label: "Bold", description: "Strong colors, high contrast" },
    { value: "playful", label: "Playful", description: "Fun, dynamic, energetic" },
    { value: "professional", label: "Professional", description: "Corporate, trustworthy" },
  ];

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        <div className="space-y-8">
          {/* Back link */}
          <Link
            href="/video-editing/brand-studio"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Brand Studio
          </Link>

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Setup</h1>
            <p className="text-muted-foreground mt-1">
              Configure your brand colors, fonts, and style
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Left Column - Settings */}
            <div className="space-y-6">
              {/* Brand Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Name</label>
                <input
                  type="text"
                  value={brand.name}
                  onChange={(e) => updateBrand({ name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  placeholder="My Brand"
                />
              </div>

              {/* Colors */}
              <div className="space-y-4">
                <h2 className="text-sm font-medium">Colors</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "primaryColor", label: "Primary" },
                    { key: "secondaryColor", label: "Secondary" },
                    { key: "accentColor", label: "Accent" },
                    { key: "backgroundColor", label: "Background" },
                    { key: "textColor", label: "Text" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-muted-foreground">{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brand[key as keyof BrandConfig] as string}
                          onChange={(e) => updateBrand({ [key]: e.target.value })}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={brand[key as keyof BrandConfig] as string}
                          onChange={(e) => updateBrand({ [key]: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fonts */}
              <div className="space-y-4">
                <h2 className="text-sm font-medium">Fonts</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Heading Font</label>
                    <select
                      value={brand.fontHeading}
                      onChange={(e) => updateBrand({ fontHeading: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    >
                      {availableFonts.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Body Font</label>
                    <select
                      value={brand.fontBody}
                      onChange={(e) => updateBrand({ fontBody: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    >
                      {availableFonts.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Style */}
              <div className="space-y-4">
                <h2 className="text-sm font-medium">Style</h2>
                <div className="grid grid-cols-2 gap-3">
                  {styles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => updateBrand({ style: style.value })}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        brand.style === style.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="font-medium text-sm">{style.label}</div>
                      <div className="text-xs text-muted-foreground">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-4">
              <h2 className="text-sm font-medium">Preview</h2>
              <div
                className="aspect-video rounded-xl overflow-hidden flex items-center justify-center relative"
                style={{ backgroundColor: brand.backgroundColor }}
              >
                {/* Sample title card preview */}
                <div className="text-center p-8">
                  <div
                    className="text-3xl font-bold mb-2"
                    style={{
                      color: brand.textColor,
                      fontFamily: brand.fontHeading,
                    }}
                  >
                    {brand.name}
                  </div>
                  <div
                    className="text-lg opacity-80"
                    style={{
                      color: brand.textColor,
                      fontFamily: brand.fontBody,
                    }}
                  >
                    Your video title here
                  </div>
                  <div
                    className="mt-4 inline-block px-4 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: brand.primaryColor,
                      color: brand.textColor,
                    }}
                  >
                    Watch Now
                  </div>
                </div>
                {/* Decorative accent */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{
                    background: `linear-gradient(to right, ${brand.primaryColor}, ${brand.secondaryColor})`,
                  }}
                />
              </div>

              {/* Color palette display */}
              <div className="flex gap-2">
                <div
                  className="flex-1 h-8 rounded-lg"
                  style={{ backgroundColor: brand.primaryColor }}
                />
                <div
                  className="flex-1 h-8 rounded-lg"
                  style={{ backgroundColor: brand.secondaryColor }}
                />
                <div
                  className="flex-1 h-8 rounded-lg"
                  style={{ backgroundColor: brand.accentColor }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <button
              onClick={handleSaveAndContinue}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Save & Continue
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              {saved ? "Saved!" : "Save"}
            </button>
            <button
              onClick={() => setBrand(defaultBrand)}
              className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
