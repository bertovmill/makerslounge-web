"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ASPECT_RATIOS = [
  { id: "1:1", label: "Square", desc: "1:1" },
  { id: "16:9", label: "Landscape", desc: "16:9" },
  { id: "9:16", label: "Portrait", desc: "9:16" },
  { id: "4:3", label: "Standard", desc: "4:3" },
];

const STYLES = [
  { id: "none", label: "None", emoji: "🎨" },
  { id: "realistic", label: "Realistic", emoji: "📷" },
  { id: "artistic", label: "Artistic", emoji: "🖼️" },
  { id: "minimal", label: "Minimal", emoji: "◻️" },
  { id: "vibrant", label: "Vibrant", emoji: "🌈" },
  { id: "professional", label: "Professional", emoji: "💼" },
];

const PRESETS = [
  {
    label: "YouTube Thumbnail",
    prompt: "Eye-catching YouTube thumbnail background, dramatic lighting, bold colors, depth of field, cinematic composition, high contrast, 4K",
    aspectRatio: "16:9",
    style: "vibrant",
  },
  {
    label: "LinkedIn Banner",
    prompt: "Clean professional banner image, subtle gradient, modern business aesthetic, soft lighting",
    aspectRatio: "16:9",
    style: "professional",
  },
  {
    label: "Instagram Post",
    prompt: "Stylish lifestyle photography, warm tones, natural lighting, aesthetically pleasing composition",
    aspectRatio: "1:1",
    style: "artistic",
  },
  {
    label: "Product Shot",
    prompt: "Minimalist product photography on a clean surface, soft shadows, studio lighting, white background",
    aspectRatio: "1:1",
    style: "minimal",
  },
];

const PROMPT_SUGGESTIONS = [
  "YouTube thumbnail: person reacting with surprised expression, bold neon background, cinematic lighting",
  "Professional headshot background with soft bokeh and gradient",
  "Abstract geometric patterns in warm coral and orange tones",
  "Minimalist product photography setup with clean lines",
  "Cozy coffee shop interior with plants and natural light",
  "Dramatic landscape with golden hour lighting for video thumbnail",
];

interface ImageGeneratorProps {
  className?: string;
}

export function ImageGenerator({ className }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [style, setStyle] = useState("none");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      if (data.images && data.images.length > 0) {
        setGeneratedImages((prev) => [...data.images, ...prev]);
        setSelectedImage(data.images[0]);
      }
    } catch (err) {
      console.error("Generate error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <div className={cn("flex flex-col lg:flex-row", className)}>
      {/* Left Panel - Controls */}
      <div className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border bg-muted/20 p-4 space-y-4 overflow-y-auto">
        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Describe your image</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A professional product photo of a laptop on a minimalist desk with soft natural lighting..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
          />
        </div>

        {/* Presets */}
        <div>
          <label className="block text-xs text-muted-foreground mb-2">Quick presets</label>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setPrompt(preset.prompt);
                  setAspectRatio(preset.aspectRatio);
                  setStyle(preset.style);
                }}
                className="text-xs px-2.5 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Suggestions */}
        <div>
          <label className="block text-xs text-muted-foreground mb-2">Try a suggestion</label>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_SUGGESTIONS.slice(0, 3).map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setPrompt(suggestion)}
                className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors truncate max-w-full"
              >
                {suggestion.slice(0, 35)}...
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
          <div className="grid grid-cols-4 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setAspectRatio(ratio.id)}
                className={cn(
                  "p-2 rounded-lg border text-center transition-all",
                  aspectRatio === ratio.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-xs font-medium">{ratio.label}</div>
                <div className="text-[10px] text-muted-foreground">{ratio.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium mb-2">Style</label>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "p-2 rounded-lg border text-center transition-all",
                  style === s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-lg mb-0.5">{s.emoji}</div>
                <div className="text-xs">{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Image
            </>
          )}
        </Button>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 bg-[#1a1a1a] flex flex-col min-h-0">
        {/* Download bar */}
        {selectedImage && (
          <div className="flex items-center justify-end px-3 py-2 border-b border-white/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(selectedImage)}
              className="text-xs h-7 border-white/20 text-white/80 hover:text-white hover:bg-white/10"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </Button>
          </div>
        )}

        {/* Main Preview */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0">
          {selectedImage ? (
            <img
              src={selectedImage}
              alt="Generated"
              className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            />
          ) : isGenerating ? (
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 animate-pulse opacity-50" />
                <div className="absolute inset-2 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                  <svg className="w-12 h-12 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">Creating your image...</p>
              <p className="text-muted-foreground/60 text-xs mt-1">This may take 10-30 seconds</p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <svg className="w-20 h-20 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm mb-2">No image generated yet</p>
              <p className="text-xs text-muted-foreground/60">Enter a prompt and click Generate</p>
            </div>
          )}
        </div>

        {/* Generated Images Gallery */}
        {generatedImages.length > 0 && (
          <div className="border-t border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Generated Images ({generatedImages.length})</span>
              {generatedImages.length > 1 && (
                <button
                  onClick={() => setGeneratedImages([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {generatedImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                    selectedImage === img
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent hover:border-primary/50"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
