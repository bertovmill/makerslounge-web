"use client";

import { useState, useCallback, useRef } from "react";
import Logo, { LogoIcon } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ── Download utilities ── */

function downloadSvgFromElement(svgElement: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPngFromSvg(svgElement: SVGSVGElement, filename: string, scale = 2) {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const viewBox = svgElement.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, 400, 400];
  const width = viewBox[2] * scale;
  const height = viewBox[3] * scale;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename;
    a.click();
  };
  img.src = url;
}

function DownloadButton({
  svgRef,
  filename,
  label,
  format = "both",
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  filename: string;
  label?: string;
  format?: "svg" | "png" | "both";
}) {
  const handleDownload = (type: "svg" | "png") => {
    const svg = svgRef.current;
    if (!svg) return;
    if (type === "svg") {
      downloadSvgFromElement(svg, `${filename}.svg`);
    } else {
      downloadPngFromSvg(svg, `${filename}.png`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-muted-foreground mr-1">{label}</span>}
      {(format === "svg" || format === "both") && (
        <button
          onClick={() => handleDownload("svg")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          SVG
        </button>
      )}
      {(format === "png" || format === "both") && (
        <button
          onClick={() => handleDownload("png")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          PNG
        </button>
      )}
    </div>
  );
}

function StaticFileDownload({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label}
    </a>
  );
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      title={`Copy ${label || value}`}
    >
      {copied ? "Copied!" : value}
    </button>
  );
}

function ColorSwatch({
  name,
  oklch,
  hex,
  rgb,
  cssVar,
  className,
  usage,
}: {
  name: string;
  oklch: string;
  hex: string;
  rgb?: string;
  cssVar?: string;
  className?: string;
  usage?: string;
}) {
  return (
    <div className="group">
      <div
        className={`w-full aspect-square rounded-2xl shadow-sm border border-border/50 mb-3 transition-transform duration-200 group-hover:scale-[1.02] ${className || ""}`}
        style={cssVar ? { backgroundColor: `var(${cssVar})` } : { backgroundColor: hex }}
      />
      <p className="font-semibold text-sm mb-1">{name}</p>
      <div className="space-y-0.5">
        <CopyButton value={hex} label="hex" />
        <br />
        <CopyButton value={oklch} label="oklch" />
        {rgb && (
          <>
            <br />
            <CopyButton value={rgb} label="rgb" />
          </>
        )}
      </div>
      {usage && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{usage}</p>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-lg max-w-2xl">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/* ── Inline SVG templates for social/business card previews ── */

function SocialProfilePreview({ svgRef }: { svgRef?: React.RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={svgRef} viewBox="0 0 400 400" className="w-full rounded-2xl shadow-sm border border-border/50">
      <rect width="400" height="400" rx="24" fill="#0f172a" />
      {/* Gradient wave background */}
      <defs>
        <linearGradient id="socialWave" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.4" />
          <stop offset="33%" stopColor="#0d9488" stopOpacity="0.3" />
          <stop offset="66%" stopColor="#ea580c" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="24" fill="url(#socialWave)" />
      {/* Logo shapes - coral */}
      <g transform="translate(140, 110) scale(1.8)">
        <rect x="5" y="30" width="52" height="52" rx="14" fill="#EE7878" opacity="0.9" />
        <rect x="22" y="8" width="52" height="52" rx="14" fill="#64C0C4" opacity="0.9" />
        <rect x="38" y="25" width="52" height="52" rx="14" fill="#EDB070" opacity="0.9" />
      </g>
      {/* Wordmark */}
      <text x="200" y="320" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="28" fontWeight="700" fill="white">
        MakersLounge
      </text>
      <text x="200" y="350" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="14" fill="#94a3b8">
        Find Your People
      </text>
    </svg>
  );
}

function SocialBannerPreview({ svgRef }: { svgRef?: React.RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={svgRef} viewBox="0 0 1200 630" className="w-full rounded-2xl shadow-sm border border-border/50">
      <rect width="1200" height="630" rx="16" fill="#0f172a" />
      <defs>
        <linearGradient id="bannerWave" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.5" />
          <stop offset="33%" stopColor="#0d9488" stopOpacity="0.4" />
          <stop offset="66%" stopColor="#ea580c" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" rx="16" fill="url(#bannerWave)" />
      {/* Logo shapes */}
      <g transform="translate(80, 160) scale(2.5)">
        <rect x="5" y="30" width="52" height="52" rx="14" fill="#EE7878" opacity="0.9" />
        <rect x="22" y="8" width="52" height="52" rx="14" fill="#64C0C4" opacity="0.9" />
        <rect x="38" y="25" width="52" height="52" rx="14" fill="#EDB070" opacity="0.9" />
      </g>
      {/* Text */}
      <text x="420" y="260" fontFamily="system-ui, sans-serif" fontSize="64" fontWeight="700" fill="white">MakersLounge</text>
      <text x="420" y="320" fontFamily="system-ui, sans-serif" fontSize="28" fill="#94a3b8">We help makers in their building journey</text>
      {/* Wave accent line */}
      <rect x="420" y="350" width="200" height="4" rx="2" fill="#EE7878" />
      <rect x="620" y="350" width="150" height="4" rx="2" fill="#64C0C4" />
      <rect x="770" y="350" width="100" height="4" rx="2" fill="#EDB070" />
      {/* URL */}
      <text x="420" y="520" fontFamily="system-ui, sans-serif" fontSize="22" fill="#64748b">makerslounge.com</text>
    </svg>
  );
}

function BusinessCardPreview({ side, svgRef }: { side: "front" | "back"; svgRef?: React.RefObject<SVGSVGElement | null> }) {
  if (side === "back") {
    return (
      <svg ref={svgRef} viewBox="0 0 700 400" className="w-full rounded-xl shadow-sm border border-border/50">
        <rect width="700" height="400" rx="12" fill="#0f172a" />
        <defs>
          <linearGradient id="cardBackWave" x1="0" y1="0.5" x2="1" y2="0.5">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.3" />
            <stop offset="33%" stopColor="#0d9488" stopOpacity="0.2" />
            <stop offset="66%" stopColor="#ea580c" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect width="700" height="400" rx="12" fill="url(#cardBackWave)" />
        {/* Centered logo */}
        <g transform="translate(275, 100) scale(1.5)">
          <rect x="5" y="30" width="52" height="52" rx="14" fill="#EE7878" opacity="0.9" />
          <rect x="22" y="8" width="52" height="52" rx="14" fill="#64C0C4" opacity="0.9" />
          <rect x="38" y="25" width="52" height="52" rx="14" fill="#EDB070" opacity="0.9" />
        </g>
        <text x="350" y="290" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="28" fontWeight="700" fill="white">MakersLounge</text>
        <text x="350" y="320" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="14" fill="#64748b">makerslounge.com</text>
        {/* Wave accent */}
        <rect x="200" y="350" width="100" height="3" rx="1.5" fill="#EE7878" />
        <rect x="300" y="350" width="100" height="3" rx="1.5" fill="#64C0C4" />
        <rect x="400" y="350" width="100" height="3" rx="1.5" fill="#EDB070" />
      </svg>
    );
  }

  return (
    <svg ref={side === "front" ? svgRef : undefined} viewBox="0 0 700 400" className="w-full rounded-xl shadow-sm border border-border/50">
      <rect width="700" height="400" rx="12" fill="white" />
      {/* Top accent strip */}
      <defs>
        <linearGradient id="cardStrip" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="33%" stopColor="#0d9488" />
          <stop offset="66%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="700" height="6" rx="0" fill="url(#cardStrip)" />
      {/* Logo icon */}
      <g transform="translate(40, 40) scale(0.7)">
        <rect x="5" y="30" width="52" height="52" rx="14" fill="#EE7878" />
        <rect x="22" y="8" width="52" height="52" rx="14" fill="#64C0C4" />
        <rect x="38" y="25" width="52" height="52" rx="14" fill="#EDB070" />
      </g>
      <text x="110" y="76" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="700" fill="#1e293b">MakersLounge</text>
      {/* Contact info */}
      <text x="50" y="180" fontFamily="system-ui, sans-serif" fontSize="28" fontWeight="700" fill="#1e293b">Your Name</text>
      <text x="50" y="215" fontFamily="system-ui, sans-serif" fontSize="16" fill="#64748b">Co-Founder &amp; CEO</text>
      <text x="50" y="290" fontFamily="system-ui, sans-serif" fontSize="14" fill="#64748b">hello@makerslounge.com</text>
      <text x="50" y="315" fontFamily="system-ui, sans-serif" fontSize="14" fill="#64748b">makerslounge.com</text>
      <text x="50" y="340" fontFamily="system-ui, sans-serif" fontSize="14" fill="#64748b">Toronto, Canada</text>
      {/* QR placeholder */}
      <rect x="540" y="240" width="110" height="110" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
      <text x="595" y="303" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#94a3b8">QR Code</text>
    </svg>
  );
}

const NAV_ITEMS = [
  { id: "positioning", label: "Positioning" },
  { id: "logo", label: "Logo" },
  { id: "logo-files", label: "Logo Files" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "gradients", label: "Gradients" },
  { id: "templates", label: "Templates" },
  { id: "components", label: "Components" },
  { id: "usage", label: "Guidelines" },
];

export default function BrandPage() {
  const logoIconRef = useRef<SVGSVGElement>(null);
  const socialProfileRef = useRef<SVGSVGElement>(null);
  const socialBannerRef = useRef<SVGSVGElement>(null);
  const cardFrontRef = useRef<SVGSVGElement>(null);
  const cardBackRef = useRef<SVGSVGElement>(null);
  const slideRef = useRef<SVGSVGElement>(null);
  const emailSigRef = useRef<SVGSVGElement>(null);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 gradient-wave-subtle opacity-50" />
        <div className="absolute inset-0 gradient-warm opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">
            Brand Kit v1.0
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-gradient">MakersLounge</span> Brand
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Everything you need to represent MakersLounge consistently. Our complete brand identity system for every touchpoint.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm py-1.5 px-4">Logo System</Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-4">Color Palette</Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-4">Typography</Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-4">Templates</Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-4">Voice & Tone</Badge>
          </div>
        </div>
      </div>

      {/* Sticky nav */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-28">

        {/* ── Brand Positioning ── */}
        <Section
          id="positioning"
          title="Brand Positioning"
          description="Who we are, what we stand for, and how we show up in the world."
        >
          {/* Mission / Vision / Values */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 border-0 bg-gradient-to-b from-blue-50/80 to-blue-50/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--ml-blue)]" />
              <h3 className="text-lg font-bold mb-3 text-[var(--ml-blue)]">Mission</h3>
              <p className="text-foreground leading-relaxed">
                Connect makers, builders, and creators with the people and resources they need to bring their ideas to life.
              </p>
            </Card>
            <Card className="p-8 border-0 bg-gradient-to-b from-teal-50/80 to-teal-50/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--ml-teal)]" />
              <h3 className="text-lg font-bold mb-3 text-[var(--ml-teal)]">Vision</h3>
              <p className="text-foreground leading-relaxed">
                A world where no builder works alone. Every maker has a community that accelerates their journey from idea to impact.
              </p>
            </Card>
            <Card className="p-8 border-0 bg-gradient-to-b from-orange-50/80 to-orange-50/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--ml-orange)]" />
              <h3 className="text-lg font-bold mb-3 text-[var(--ml-orange)]">Values</h3>
              <ul className="text-foreground leading-relaxed space-y-1.5">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--ml-orange)]" /> Community first</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--ml-orange)]" /> Build in public</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--ml-orange)]" /> Radical inclusivity</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--ml-orange)]" /> Ship &gt; perfect</li>
              </ul>
            </Card>
          </div>

          {/* Brand personality */}
          <h3 className="text-xl font-semibold mb-4">Brand Personality</h3>
          <Card className="p-8">
            <div className="grid md:grid-cols-5 gap-6">
              {[
                { trait: "Warm", desc: "Inviting and human, never cold or corporate", pct: 90 },
                { trait: "Creative", desc: "Playful and expressive, celebrating makers", pct: 85 },
                { trait: "Trustworthy", desc: "Reliable and authentic, no empty promises", pct: 80 },
                { trait: "Modern", desc: "Tech-forward without being intimidating", pct: 75 },
                { trait: "Bold", desc: "Confident opinions, not afraid to lead", pct: 70 },
              ].map((p) => (
                <div key={p.trait} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                      <circle cx="40" cy="40" r="35" fill="none" stroke="var(--border)" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="35" fill="none"
                        stroke="var(--primary)" strokeWidth="6"
                        strokeDasharray={`${(p.pct / 100) * 220} 220`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{p.pct}%</span>
                  </div>
                  <h4 className="font-semibold text-sm">{p.trait}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Target audience */}
          <h3 className="text-xl font-semibold mb-4 mt-12">Target Audience</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8">
              <h4 className="font-semibold mb-3">Primary: Builders & Makers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Software developers, designers, hardware makers</li>
                <li>Early-stage founders and indie hackers</li>
                <li>Content creators and creative professionals</li>
                <li>Age 22-40, tech-savvy, growth-oriented</li>
              </ul>
            </Card>
            <Card className="p-8">
              <h4 className="font-semibold mb-3">Secondary: Community Leaders</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Meetup organizers and hackathon runners</li>
                <li>Startup ecosystem builders</li>
                <li>Incubator / accelerator managers</li>
                <li>People who connect people</li>
              </ul>
            </Card>
          </div>

          {/* Taglines */}
          <h3 className="text-xl font-semibold mb-4 mt-12">Approved Taglines</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { tagline: "Find Your People", context: "Primary — hero, social bios" },
              { tagline: "We help makers in their building journey", context: "Secondary — about, descriptions" },
              { tagline: "Where builders connect", context: "Tertiary — short-form, ads" },
            ].map((t) => (
              <Card key={t.tagline} className="p-6 text-center">
                <p className="font-serif text-2xl mb-2">&ldquo;{t.tagline}&rdquo;</p>
                <p className="text-xs text-muted-foreground">{t.context}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* ── Logo ── */}
        <Section
          id="logo"
          title="Logo System"
          description="The MakersLounge logo combines three overlapping rounded rectangles (coral, teal, peach) with the wordmark. Use these consistently across all touchpoints."
        >
          {/* Primary logo on light/dark */}
          {/* Hidden downloadable logo SVG */}
          <svg ref={logoIconRef} viewBox="0 0 100 100" width="0" height="0" style={{ position: "absolute", opacity: 0 }} xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="30" width="52" height="52" rx="14" fill="#EE7878" />
            <rect x="7" y="32" width="48" height="48" rx="12" fill="url(#dlCoralFill)" />
            <rect x="22" y="8" width="52" height="52" rx="14" fill="#64C0C4" />
            <rect x="24" y="10" width="48" height="48" rx="12" fill="url(#dlTealFill)" />
            <rect x="38" y="25" width="52" height="52" rx="14" fill="#EDB070" />
            <rect x="40" y="27" width="48" height="48" rx="12" fill="url(#dlPeachFill)" />
            <defs>
              <linearGradient id="dlCoralFill" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#F28C8C" />
                <stop offset="100%" stopColor="#EE7878" />
              </linearGradient>
              <linearGradient id="dlTealFill" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#74CCCE" />
                <stop offset="100%" stopColor="#64C0C4" />
              </linearGradient>
              <linearGradient id="dlPeachFill" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#F2BC84" />
                <stop offset="100%" stopColor="#EDB070" />
              </linearGradient>
            </defs>
          </svg>

          <h3 className="text-xl font-semibold mb-4">Primary Logo</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-4">
            <Card className="p-12 flex items-center justify-center bg-white border-dashed">
              <Logo size="lg" />
            </Card>
            <Card className="p-12 flex items-center justify-center bg-slate-900 border-dashed">
              <div className="flex items-center gap-3">
                <LogoIcon size={64} />
                <span className="font-bold text-3xl font-heading tracking-tight">
                  <span className="text-blue-400">Makers</span>
                  <span className="text-white"> Lounge</span>
                </span>
              </div>
            </Card>
          </div>
          <div className="flex flex-wrap gap-3 mb-12">
            <DownloadButton svgRef={logoIconRef} filename="makerslounge-logo-icon" label="Logo Icon:" />
            <StaticFileDownload href="/icon-512.png" label="PNG 512px" />
            <StaticFileDownload href="/icon-192.png" label="PNG 192px" />
            <StaticFileDownload href="/apple-touch-icon.png" label="Apple Touch Icon" />
            <StaticFileDownload href="/favicon.svg" label="Favicon SVG" />
          </div>

          {/* Logo variants */}
          <h3 className="text-xl font-semibold mb-4">Variants & Sizes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <Card className="p-8 flex flex-col items-center justify-center gap-4 bg-muted/30">
              <Logo size="lg" />
              <span className="text-xs text-muted-foreground">Full — Large</span>
            </Card>
            <Card className="p-8 flex flex-col items-center justify-center gap-4 bg-muted/30">
              <Logo size="md" />
              <span className="text-xs text-muted-foreground">Full — Medium</span>
            </Card>
            <Card className="p-8 flex flex-col items-center justify-center gap-4 bg-muted/30">
              <Logo size="sm" />
              <span className="text-xs text-muted-foreground">Full — Small</span>
            </Card>
            <Card className="p-8 flex flex-col items-center justify-center gap-4 bg-muted/30">
              <LogoIcon size={64} />
              <span className="text-xs text-muted-foreground">Icon Only</span>
            </Card>
          </div>

          {/* Minimum size & clear space */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 bg-muted/30">
              <h4 className="font-semibold mb-2">Minimum Size</h4>
              <p className="text-sm text-muted-foreground mb-4">
                The logo should never appear smaller than these minimum sizes to ensure legibility.
              </p>
              <div className="flex items-end gap-8">
                <div className="text-center">
                  <div className="bg-white rounded-lg p-3 inline-block border border-border/50 mb-2">
                    <LogoIcon size={32} />
                  </div>
                  <p className="text-xs text-muted-foreground">32px — Icon</p>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-lg p-3 inline-block border border-border/50 mb-2">
                    <Logo size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">120px — Full</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-muted/30">
              <h4 className="font-semibold mb-2">Clear Space</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Maintain a minimum clear space around the logo equal to the height of the logo icon. Never crowd it.
              </p>
              <div className="flex items-center justify-center">
                <div className="border-2 border-dashed border-primary/30 p-6 rounded-xl">
                  <LogoIcon size={48} />
                </div>
              </div>
            </Card>
          </div>

          {/* Color variants */}
          <h3 className="text-xl font-semibold mb-4 mt-12">Color Contexts</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="p-6 flex flex-col items-center justify-center gap-3 bg-white">
              <LogoIcon size={48} />
              <span className="text-xs text-muted-foreground">On White</span>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center gap-3 bg-slate-100">
              <LogoIcon size={48} />
              <span className="text-xs text-muted-foreground">On Light Gray</span>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center gap-3 bg-slate-900">
              <LogoIcon size={48} />
              <span className="text-xs text-slate-400">On Dark</span>
            </Card>
            <div className="p-6 flex flex-col items-center justify-center gap-3 rounded-xl gradient-wave">
              <LogoIcon size={48} />
              <span className="text-xs text-white/80">On Brand Gradient</span>
            </div>
          </div>
        </Section>

        {/* ── Logo Files ── */}
        <Section
          id="logo-files"
          title="Logo Files"
          description="Download any logo variant as SVG or PNG. Use the appropriate version for each platform."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { src: "/logos/logo.svg", png: "/logos/logo.png", label: "Logo (default)", bg: "bg-white border" },
              { src: "/logos/logo-light.svg", label: "Logo (light / dark bg)", bg: "bg-gray-900" },
              { src: "/logos/logo-blue.svg", png: "/logos/logo-blue.png", label: "Logo (blue)", bg: "bg-white border" },
              { src: "/logos/logo-white.png", label: "Logo (white)", bg: "bg-[#1A7DE8]" },
              { src: "/logos/logo-instagram.svg", png: "/logos/logo-instagram.png", label: "Instagram profile", bg: "bg-white border" },
              { src: "/logos/logo-instagram-blue.svg", png: "/logos/logo-instagram-blue.png", label: "Instagram profile (blue)", bg: "bg-white border" },
              { src: "/logos/logo-luma.svg", png: "/logos/logo-luma.png", label: "Luma profile", bg: "bg-white border" },
              { src: "/logos/logo-banner-blue.svg", png: "/logos/logo-banner-blue.png", label: "Banner (blue)", bg: "bg-[#1A7DE8]", wide: true },
              { src: "/logos/luma-banner.svg", png: "/logos/luma-banner.png", label: "Luma banner", bg: "bg-[#1A7DE8]", wide: true },
              { src: "/logos/linkedin-banner.svg", png: "/logos/linkedin-banner.png", label: "LinkedIn banner", bg: "bg-[#1A7DE8]", wide: true },
            ].map(({ src, png, label, bg, wide }) => (
              <Card key={src} className={`p-4 border-0 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
                <div className={`rounded-lg flex items-center justify-center p-6 mb-4 ${bg}`} style={{ height: wide ? "8rem" : "8rem" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={label}
                    className="max-h-full max-w-full object-contain"
                    style={{ maxHeight: wide ? "5rem" : "4rem" }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  <div className="flex gap-2">
                    {src.endsWith(".svg") && <StaticFileDownload href={src} label="SVG" />}
                    {(png || src.endsWith(".png")) && (
                      <StaticFileDownload href={png ?? src} label="PNG" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* ── Colors ── */}
        <Section
          id="colors"
          title="Color Palette"
          description="Our palette uses OKLCH color space for perceptually uniform, vibrant colors. Click any value to copy."
        >
          {/* Brand Colors */}
          <h3 className="text-xl font-semibold mb-4">Brand Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <ColorSwatch
              name="ML Blue"
              oklch="oklch(0.5 0.2 255)"
              hex="#1d4ed8"
              rgb="rgb(29, 78, 216)"
              cssVar="--ml-blue"
              usage="Primary brand, links, active states"
            />
            <ColorSwatch
              name="ML Teal"
              oklch="oklch(0.6 0.15 195)"
              hex="#0d9488"
              rgb="rgb(13, 148, 136)"
              cssVar="--ml-teal"
              usage="Secondary accent, success states"
            />
            <ColorSwatch
              name="ML Orange"
              oklch="oklch(0.7 0.18 50)"
              hex="#ea580c"
              rgb="rgb(234, 88, 12)"
              cssVar="--ml-orange"
              usage="Warm accent, highlights, CTAs"
            />
            <ColorSwatch
              name="ML Yellow"
              oklch="oklch(0.85 0.18 90)"
              hex="#ca8a04"
              rgb="rgb(202, 138, 4)"
              cssVar="--ml-yellow"
              usage="Energy, badges, notifications"
            />
          </div>

          {/* Logo shape colors */}
          <h3 className="text-xl font-semibold mb-4">Logo Shape Colors</h3>
          <div className="grid grid-cols-3 gap-6 mb-12">
            <ColorSwatch
              name="Coral"
              oklch="linear-gradient(#F28C8C, #EE7878)"
              hex="#F28C8C"
              rgb="rgb(242, 140, 140)"
              className="bg-gradient-to-b from-[#F28C8C] to-[#EE7878]"
              usage="Bottom-left shape in logo"
            />
            <ColorSwatch
              name="Teal"
              oklch="linear-gradient(#74CCCE, #64C0C4)"
              hex="#74CCCE"
              rgb="rgb(116, 204, 206)"
              className="bg-gradient-to-b from-[#74CCCE] to-[#64C0C4]"
              usage="Top shape in logo"
            />
            <ColorSwatch
              name="Peach"
              oklch="linear-gradient(#F2BC84, #EDB070)"
              hex="#F2BC84"
              rgb="rgb(242, 188, 132)"
              className="bg-gradient-to-b from-[#F2BC84] to-[#EDB070]"
              usage="Right shape in logo"
            />
          </div>

          {/* UI Colors */}
          <h3 className="text-xl font-semibold mb-4">UI Semantic Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
            <ColorSwatch name="Primary" oklch="oklch(0.5 0.2 255)" hex="#1d4ed8" cssVar="--primary" usage="Buttons, links" />
            <ColorSwatch name="Background" oklch="oklch(0.985 0.005 250)" hex="#f8fafc" cssVar="--background" usage="Page background" />
            <ColorSwatch name="Foreground" oklch="oklch(0.2 0.02 260)" hex="#1e293b" cssVar="--foreground" usage="Body text" />
            <ColorSwatch name="Muted" oklch="oklch(0.96 0.005 250)" hex="#f1f5f9" cssVar="--muted" usage="Secondary backgrounds" />
            <ColorSwatch name="Destructive" oklch="oklch(0.55 0.22 25)" hex="#dc2626" cssVar="--destructive" usage="Errors, delete actions" />
          </div>

          {/* CTA */}
          <h3 className="text-xl font-semibold mb-4">Accent / CTA</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="group">
              <div className="w-full aspect-square rounded-2xl shadow-sm border border-border/50 mb-3 transition-transform duration-200 group-hover:scale-[1.02]" style={{ backgroundColor: "#e54b4b" }} />
              <p className="font-semibold text-sm mb-1">CTA Red</p>
              <CopyButton value="#e54b4b" />
              <p className="text-xs text-muted-foreground mt-1.5">Primary call-to-action buttons</p>
            </div>
            <div className="group">
              <div className="w-full aspect-square rounded-2xl shadow-sm mb-3 transition-transform duration-200 group-hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, oklch(0.65 0.2 30), oklch(0.7 0.18 50), oklch(0.8 0.15 70))" }} />
              <p className="font-semibold text-sm mb-1">Warm CTA Gradient</p>
              <CopyButton value="linear-gradient(135deg, oklch(0.65 0.2 30), oklch(0.7 0.18 50), oklch(0.8 0.15 70))" />
              <p className="text-xs text-muted-foreground mt-1.5">Auth, premium actions</p>
            </div>
          </div>

          {/* Color accessibility */}
          <h3 className="text-xl font-semibold mb-4">Accessibility</h3>
          <Card className="p-8">
            <div className="space-y-4">
              {[
                { fg: "#1e293b", bg: "#f8fafc", label: "Foreground on Background", ratio: "15.2:1", pass: "AAA" },
                { fg: "#ffffff", bg: "#1d4ed8", label: "White on ML Blue", ratio: "5.8:1", pass: "AA" },
                { fg: "#ffffff", bg: "#e54b4b", label: "White on CTA Red", ratio: "4.6:1", pass: "AA" },
                { fg: "#64748b", bg: "#f8fafc", label: "Muted text on Background", ratio: "5.1:1", pass: "AA" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-4">
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-border/50" style={{ backgroundColor: c.bg }}>
                      <div className="w-full h-full rounded-lg flex items-center justify-center text-xs font-bold" style={{ color: c.fg }}>Aa</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm">{c.label}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">{c.ratio}</Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">{c.pass}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── Typography ── */}
        <Section
          id="typography"
          title="Typography"
          description="Three typefaces create a clear hierarchy: Syne for bold headings, Space Grotesk for body text, and Playfair Display for elegant editorial moments."
        >
          <div className="space-y-12">
            {/* Syne */}
            <Card className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="md:w-1/3">
                  <Badge className="mb-2">Headings</Badge>
                  <h3 className="text-lg font-semibold">Syne</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Used for all headings (h1-h6), the logo wordmark, and bold UI elements. Bold and creative.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">var(--font-heading)</p>
                </div>
                <div className="md:w-2/3 space-y-3">
                  <p className="font-heading text-5xl font-bold">The quick brown fox</p>
                  <p className="font-heading text-3xl font-semibold">jumps over the lazy dog</p>
                  <p className="font-heading text-xl">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                  <p className="font-heading text-xl">abcdefghijklmnopqrstuvwxyz 0123456789</p>
                </div>
              </div>
            </Card>

            {/* Space Grotesk */}
            <Card className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="md:w-1/3">
                  <Badge className="mb-2">Body</Badge>
                  <h3 className="text-lg font-semibold">Space Grotesk</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The primary body font. Clean, geometric sans-serif for paragraphs, UI labels, navigation, and all general text.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">var(--font-sans)</p>
                </div>
                <div className="md:w-2/3 space-y-3">
                  <p className="text-3xl">The quick brown fox</p>
                  <p className="text-xl">jumps over the lazy dog</p>
                  <p className="text-base">
                    MakersLounge is a community platform that uses AI to match builders, designers, and makers with complementary skills. Share what you&apos;re working on, and we&apos;ll connect you with people who have the expertise you need.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                  </p>
                </div>
              </div>
            </Card>

            {/* Playfair Display */}
            <Card className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="md:w-1/3">
                  <Badge className="mb-2">Serif / Editorial</Badge>
                  <h3 className="text-lg font-semibold">Playfair Display</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Used sparingly for elegant editorial headlines, hero sections, and premium moments.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">var(--font-serif)</p>
                </div>
                <div className="md:w-2/3 space-y-3">
                  <p className="font-serif text-5xl">The quick brown fox</p>
                  <p className="font-serif text-3xl italic">jumps over the lazy dog</p>
                  <p className="font-serif text-xl">We help makers in their building journey</p>
                </div>
              </div>
            </Card>

            {/* Type scale */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Type Scale</h3>
              <Card className="p-8 divide-y divide-border">
                {[
                  { label: "Display", size: "4.5rem / 72px", class: "text-7xl font-bold font-heading", example: "Aa" },
                  { label: "H1", size: "3rem / 48px", class: "text-5xl font-bold font-heading", example: "Heading 1" },
                  { label: "H2", size: "2.25rem / 36px", class: "text-4xl font-bold font-heading", example: "Heading 2" },
                  { label: "H3", size: "1.5rem / 24px", class: "text-2xl font-semibold font-heading", example: "Heading 3" },
                  { label: "Body Lg", size: "1.125rem / 18px", class: "text-lg", example: "Body text large" },
                  { label: "Body", size: "1rem / 16px", class: "text-base", example: "Body text regular" },
                  { label: "Small", size: "0.875rem / 14px", class: "text-sm text-muted-foreground", example: "Small text / caption" },
                  { label: "XS", size: "0.75rem / 12px", class: "text-xs text-muted-foreground", example: "Extra small / labels" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-6 py-4 first:pt-0 last:pb-0">
                    <span className="text-xs text-muted-foreground w-16 flex-shrink-0 font-mono">{item.label}</span>
                    <span className="text-xs text-muted-foreground w-28 flex-shrink-0 hidden md:block">{item.size}</span>
                    <span className={item.class}>{item.example}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </Section>

        {/* ── Gradients ── */}
        <Section
          id="gradients"
          title="Gradients & Effects"
          description="Signature gradients and glassmorphism effects that define the MakersLounge visual language."
        >
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="overflow-hidden">
              <div className="gradient-wave h-40" />
              <div className="p-6">
                <h4 className="font-semibold mb-1">Wave Gradient</h4>
                <p className="text-sm text-muted-foreground mb-2">The signature four-color gradient. Used for hero backgrounds, buttons, and accent strips.</p>
                <CopyButton value="linear-gradient(90deg, oklch(0.5 0.2 255) 0%, oklch(0.6 0.15 195) 33%, oklch(0.7 0.18 50) 66%, oklch(0.85 0.18 90) 100%)" />
                <p className="text-xs text-muted-foreground mt-1 font-mono">.gradient-wave</p>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="gradient-wave-subtle h-40" />
              <div className="p-6">
                <h4 className="font-semibold mb-1">Wave Gradient (Subtle)</h4>
                <p className="text-sm text-muted-foreground mb-2">A 10% opacity version for overlays and muted backgrounds.</p>
                <p className="text-xs text-muted-foreground font-mono">.gradient-wave-subtle</p>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-40 flex items-center justify-center bg-muted/30">
                <span className="text-gradient text-5xl font-bold font-heading">MakersLounge</span>
              </div>
              <div className="p-6">
                <h4 className="font-semibold mb-1">Text Gradient</h4>
                <p className="text-sm text-muted-foreground mb-2">Apply to headings and logos for a modern gradient text effect.</p>
                <p className="text-xs text-muted-foreground font-mono">.text-gradient</p>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="gradient-warm h-40" />
              <div className="p-6">
                <h4 className="font-semibold mb-1">Warm Radial</h4>
                <p className="text-sm text-muted-foreground mb-2">Soft radial glow for backgrounds behind avatars and highlights.</p>
                <p className="text-xs text-muted-foreground font-mono">.gradient-warm</p>
              </div>
            </Card>
          </div>

          {/* Glass effects */}
          <h3 className="text-xl font-semibold mb-4">Glassmorphism</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 gradient-wave opacity-30" />
              <div className="relative p-8">
                <div className="glass rounded-xl p-6">
                  <h4 className="font-semibold mb-1">Glass</h4>
                  <p className="text-sm text-muted-foreground">70% white background with 12px blur. For floating UI elements.</p>
                  <p className="text-xs text-muted-foreground font-mono mt-2">.glass</p>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 gradient-wave opacity-30" />
              <div className="relative p-8">
                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold mb-1">Glass Card</h4>
                  <p className="text-sm text-muted-foreground">90% white background with 8px blur and subtle shadow. Hover for elevation.</p>
                  <p className="text-xs text-muted-foreground font-mono mt-2">.glass-card</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Templates ── */}
        <Section
          id="templates"
          title="Brand Templates"
          description="Ready-to-use templates for social media, business cards, and marketing materials."
        >
          {/* Social media */}
          <h3 className="text-xl font-semibold mb-4">Social Media</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <SocialProfilePreview svgRef={socialProfileRef} />
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Profile Image</strong> — 400x400px
                </p>
                <DownloadButton svgRef={socialProfileRef} filename="makerslounge-social-profile" />
              </div>
            </div>
            <div>
              <SocialBannerPreview svgRef={socialBannerRef} />
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Banner / OG Image</strong> — 1200x630px
                </p>
                <DownloadButton svgRef={socialBannerRef} filename="makerslounge-social-banner" />
              </div>
            </div>
          </div>

          {/* Business card */}
          <h3 className="text-xl font-semibold mb-4">Business Card</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <BusinessCardPreview side="front" svgRef={cardFrontRef} />
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-muted-foreground"><strong>Front</strong></p>
                <DownloadButton svgRef={cardFrontRef} filename="makerslounge-card-front" />
              </div>
            </div>
            <div>
              <BusinessCardPreview side="back" svgRef={cardBackRef} />
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-muted-foreground"><strong>Back</strong></p>
                <DownloadButton svgRef={cardBackRef} filename="makerslounge-card-back" />
              </div>
            </div>
          </div>

          {/* Email signature */}
          <h3 className="text-xl font-semibold mb-4">Email Signature</h3>
          <Card className="p-8">
            <div className="border border-border rounded-xl p-6 max-w-lg bg-white">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                  <LogoIcon size={40} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Your Name</p>
                  <p className="text-sm text-muted-foreground">Co-Founder, MakersLounge</p>
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">hello@makerslounge.com</p>
                    <p className="text-xs text-primary">makerslounge.com</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex gap-0.5">
                  <div className="h-1 flex-1 rounded-full bg-[#EE7878]" />
                  <div className="h-1 flex-1 rounded-full bg-[#64C0C4]" />
                  <div className="h-1 flex-1 rounded-full bg-[#EDB070]" />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Standard email signature with logo, contact info, and wave accent.</p>
          </Card>

          {/* Presentation slide */}
          <h3 className="text-xl font-semibold mb-4 mt-12">Presentation Title Slide</h3>
          <Card className="overflow-hidden">
            <svg ref={slideRef} viewBox="0 0 1600 900" className="w-full">
              <rect width="1600" height="900" fill="#0f172a" />
              <defs>
                <linearGradient id="slideWave" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#0d9488" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <rect width="1600" height="900" fill="url(#slideWave)" />
              {/* Logo */}
              <g transform="translate(80, 60) scale(0.9)">
                <rect x="5" y="30" width="52" height="52" rx="14" fill="#EE7878" opacity="0.9" />
                <rect x="22" y="8" width="52" height="52" rx="14" fill="#64C0C4" opacity="0.9" />
                <rect x="38" y="25" width="52" height="52" rx="14" fill="#EDB070" opacity="0.9" />
              </g>
              <text x="170" y="100" fontFamily="system-ui, sans-serif" fontSize="24" fontWeight="700" fill="white">MakersLounge</text>
              {/* Main title */}
              <text x="80" y="420" fontFamily="Georgia, serif" fontSize="72" fontWeight="700" fill="white">Presentation Title</text>
              <text x="80" y="490" fontFamily="system-ui, sans-serif" fontSize="28" fill="#94a3b8">Subtitle or description goes here</text>
              {/* Wave strip */}
              <rect x="80" y="530" width="300" height="4" rx="2" fill="#EE7878" />
              <rect x="380" y="530" width="200" height="4" rx="2" fill="#64C0C4" />
              <rect x="580" y="530" width="150" height="4" rx="2" fill="#EDB070" />
              {/* Date / presenter */}
              <text x="80" y="820" fontFamily="system-ui, sans-serif" fontSize="18" fill="#64748b">Your Name  |  February 2026</text>
            </svg>
          </Card>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">16:9 presentation title slide template</p>
            <DownloadButton svgRef={slideRef} filename="makerslounge-slide-title" />
          </div>
        </Section>

        {/* ── Components ── */}
        <Section
          id="components"
          title="UI Components"
          description="Core components built with shadcn/ui and our design tokens."
        >
          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-semibold mb-4">Buttons</h3>
              <Card className="p-8">
                <div className="flex flex-wrap gap-4 items-center">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button className="rounded-full px-6">Rounded</Button>
                  <Button className="rounded-full px-6 bg-[#e54b4b] hover:bg-[#d43d3d]">CTA Red</Button>
                  <button className="auth-cta-btn rounded-full px-6 py-2 text-sm font-medium">Warm CTA</button>
                </div>
                <div className="flex flex-wrap gap-4 items-center mt-6">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </Card>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Badges</h3>
              <Card className="p-8">
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </Card>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Cards</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h4 className="font-semibold mb-2">Default Card</h4>
                  <p className="text-sm text-muted-foreground">Standard card with border and padding.</p>
                </Card>
                <Card className="p-6 border-0 bg-gradient-to-b from-muted/50 to-muted/30 hover:shadow-xl transition-all duration-300">
                  <h4 className="font-semibold mb-2">Gradient Card</h4>
                  <p className="text-sm text-muted-foreground">Muted gradient background, no border.</p>
                </Card>
                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold mb-2">Glass Card</h4>
                  <p className="text-sm text-muted-foreground">Glassmorphism with blur and shadow.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Border Radius</h3>
              <Card className="p-8">
                <div className="flex flex-wrap gap-6 items-end">
                  {[
                    { label: "sm", class: "rounded-sm" },
                    { label: "md", class: "rounded-md" },
                    { label: "lg", class: "rounded-lg" },
                    { label: "xl", class: "rounded-xl" },
                    { label: "2xl", class: "rounded-2xl" },
                    { label: "full", class: "rounded-full" },
                  ].map((r) => (
                    <div key={r.label} className="text-center">
                      <div className={`w-16 h-16 bg-primary ${r.class} mb-2`} />
                      <span className="text-xs text-muted-foreground font-mono">{r.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Base radius: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">0.75rem</code> (--radius). Cards use rounded-xl, buttons rounded-lg or rounded-full.
                </p>
              </Card>
            </div>
          </div>
        </Section>

        {/* ── Usage Guidelines ── */}
        <Section
          id="usage"
          title="Usage Guidelines"
          description="Rules and best practices for using the MakersLounge brand consistently."
        >
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-green-200 bg-green-50/50">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Do
              </h3>
              <ul className="space-y-3 text-sm text-green-800">
                {[
                  "Use the logo with adequate clear space around it",
                  "Use brand colors from the OKLCH palette for consistency",
                  "Maintain the heading/body font pairing (Syne + Space Grotesk)",
                  "Use glass effects on colored or image backgrounds",
                  "Keep the warm, approachable tone across all materials",
                  "Test color combinations for WCAG AA accessibility",
                  "Use approved taglines in marketing materials",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-8 border-red-200 bg-red-50/50">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Don&apos;t
              </h3>
              <ul className="space-y-3 text-sm text-red-800">
                {[
                  "Stretch, rotate, or distort the logo",
                  "Change the logo colors or rearrange the shapes",
                  "Use low-contrast color combinations that hurt readability",
                  "Place the logo on busy backgrounds without a container",
                  "Mix brand fonts with unrelated typefaces",
                  "Use the logo smaller than minimum size requirements",
                  "Create unauthorized logo lockups or modifications",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Voice & Tone */}
          <Card className="p-8 mt-8">
            <h3 className="text-xl font-semibold mb-6">Voice & Tone</h3>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-primary mb-2">Approachable</h4>
                <p className="text-sm text-muted-foreground">
                  Friendly, inclusive language that welcomes all types of makers. We say &quot;you&quot; not &quot;users.&quot;
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Empowering</h4>
                <p className="text-sm text-muted-foreground">
                  We help people build things. Our messaging focuses on what makers can achieve, not what we do.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Clear</h4>
                <p className="text-sm text-muted-foreground">
                  Simple, direct language. No jargon. If a 5th grader can&apos;t understand it, simplify it.
                </p>
              </div>
            </div>

            <h4 className="font-semibold mb-3">Writing Examples</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50/50 border border-green-200">
                <p className="text-xs text-green-600 font-semibold mb-1">DO</p>
                <p className="text-sm text-green-800">&quot;Find builders who complement your skills&quot;</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50/50 border border-red-200">
                <p className="text-xs text-red-600 font-semibold mb-1">DON&apos;T</p>
                <p className="text-sm text-red-800">&quot;Our platform leverages AI to facilitate synergistic connections&quot;</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50/50 border border-green-200">
                <p className="text-xs text-green-600 font-semibold mb-1">DO</p>
                <p className="text-sm text-green-800">&quot;Share what you&apos;re building&quot;</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50/50 border border-red-200">
                <p className="text-xs text-red-600 font-semibold mb-1">DON&apos;T</p>
                <p className="text-sm text-red-800">&quot;Upload your project portfolio to optimize match quality&quot;</p>
              </div>
            </div>
          </Card>

          {/* Asset file structure */}
          <Card className="p-8 mt-8">
            <h3 className="text-xl font-semibold mb-4">Brand Asset Structure</h3>
            <p className="text-sm text-muted-foreground mb-4">Recommended file organization for brand assets across teams.</p>
            <div className="bg-muted/50 rounded-xl p-6 font-mono text-sm">
              <pre className="text-muted-foreground whitespace-pre-wrap">{`brand-assets/
  logo/
    svg/
      logo-full.svg
      logo-icon.svg
      logo-wordmark.svg
    png/
      logo-full@1x.png (480px)
      logo-full@2x.png (960px)
      logo-icon-32.png
      logo-icon-64.png
      logo-icon-128.png
      logo-icon-512.png
  colors/
    palette.json
    palette.css
  fonts/
    SpaceGrotesk-Variable.woff2
    Syne-Variable.woff2
    PlayfairDisplay-Variable.woff2
  templates/
    social-profile-400x400.svg
    social-banner-1200x630.svg
    business-card-front.svg
    business-card-back.svg
    email-signature.html
    slide-title.svg
  guidelines/
    brand-guidelines.pdf`}</pre>
            </div>
          </Card>
        </Section>
      </div>
    </div>
  );
}
