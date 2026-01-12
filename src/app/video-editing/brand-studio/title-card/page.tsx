"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { loadBrand, BrandConfig, defaultBrand } from "@/lib/brand-storage";
import { cn } from "@/lib/utils";

type LayoutStyle = "centered" | "left-aligned" | "split" | "minimal" | "bold-gradient";

interface TitleCardData {
  title: string;
  subtitle: string;
  layout: LayoutStyle;
}

export default function TitleCardGeneratorPage() {
  const [brand, setBrand] = useState<BrandConfig>(defaultBrand);
  const [card, setCard] = useState<TitleCardData>({
    title: "How to Build Your First App",
    subtitle: "A step-by-step guide for beginners",
    layout: "centered",
  });
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBrand(loadBrand());
  }, []);

  const layouts: { value: LayoutStyle; label: string }[] = [
    { value: "centered", label: "Centered" },
    { value: "left-aligned", label: "Left Aligned" },
    { value: "split", label: "Split" },
    { value: "minimal", label: "Minimal" },
    { value: "bold-gradient", label: "Bold Gradient" },
  ];

  const exportAsPNG = async () => {
    if (!cardRef.current) return;
    setExporting(true);

    try {
      // Dynamic import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `title-card-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const renderCard = () => {
    const baseStyles = {
      backgroundColor: brand.backgroundColor,
      color: brand.textColor,
      fontFamily: brand.fontHeading,
    };

    switch (card.layout) {
      case "centered":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center" style={baseStyles}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: brand.fontHeading }}>
              {card.title}
            </h1>
            {card.subtitle && (
              <p className="text-xl opacity-80" style={{ fontFamily: brand.fontBody }}>
                {card.subtitle}
              </p>
            )}
            <div
              className="mt-8 w-24 h-1 rounded-full"
              style={{ background: `linear-gradient(to right, ${brand.primaryColor}, ${brand.secondaryColor})` }}
            />
          </div>
        );

      case "left-aligned":
        return (
          <div className="w-full h-full flex flex-col justify-center p-12" style={baseStyles}>
            <div
              className="w-16 h-1 rounded-full mb-6"
              style={{ backgroundColor: brand.primaryColor }}
            />
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: brand.fontHeading }}>
              {card.title}
            </h1>
            {card.subtitle && (
              <p className="text-xl opacity-80" style={{ fontFamily: brand.fontBody }}>
                {card.subtitle}
              </p>
            )}
          </div>
        );

      case "split":
        return (
          <div className="w-full h-full flex" style={baseStyles}>
            <div
              className="w-2"
              style={{ background: `linear-gradient(to bottom, ${brand.primaryColor}, ${brand.secondaryColor})` }}
            />
            <div className="flex-1 flex flex-col justify-center p-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: brand.fontHeading }}>
                {card.title}
              </h1>
              {card.subtitle && (
                <p className="text-xl opacity-80" style={{ fontFamily: brand.fontBody }}>
                  {card.subtitle}
                </p>
              )}
            </div>
          </div>
        );

      case "minimal":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center" style={baseStyles}>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ fontFamily: brand.fontHeading }}>
              {card.title}
            </h1>
          </div>
        );

      case "bold-gradient":
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-12 text-center"
            style={{
              background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})`,
              color: "#ffffff",
            }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight drop-shadow-lg" style={{ fontFamily: brand.fontHeading }}>
              {card.title}
            </h1>
            {card.subtitle && (
              <p className="text-xl opacity-90 drop-shadow" style={{ fontFamily: brand.fontBody }}>
                {card.subtitle}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Title Card Generator</h1>
              <p className="text-muted-foreground mt-1">
                Create eye-catching intro slides for your videos
              </p>
            </div>
            <button
              onClick={exportAsPNG}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export PNG
                </>
              )}
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left - Controls */}
            <div className="space-y-6">
              {/* Text inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => setCard((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                    placeholder="Your video title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subtitle (optional)</label>
                  <input
                    type="text"
                    value={card.subtitle}
                    onChange={(e) => setCard((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                    placeholder="A brief description"
                  />
                </div>
              </div>

              {/* Layout selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {layouts.map((layout) => (
                    <button
                      key={layout.value}
                      onClick={() => setCard((prev) => ({ ...prev, layout: layout.value }))}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm transition-all",
                        card.layout === layout.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand reminder */}
              <div className="p-4 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">
                  Using brand: <span className="font-medium text-foreground">{brand.name}</span>
                </p>
                <Link
                  href="/video-editing/brand-studio/setup"
                  className="text-primary hover:underline text-xs"
                >
                  Change brand settings
                </Link>
              </div>
            </div>

            {/* Right - Preview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Preview (1920x1080)</label>
                <span className="text-xs text-muted-foreground">16:9 aspect ratio</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-border shadow-2xl">
                <div
                  ref={cardRef}
                  className="aspect-video"
                  style={{ width: "100%", minHeight: 300 }}
                >
                  {renderCard()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
