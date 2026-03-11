"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Briefcase, Lightbulb, TrendingUp } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  bio: string | null;
  skills: string[] | null;
  photo_url: string | null;
}

interface SkillCount {
  name: string;
  count: number;
}

// Monochrome shades for charts (darkest to lightest)
const SHADES = [
  "var(--foreground)",
  "oklch(0.35 0 0)",
  "oklch(0.45 0 0)",
  "oklch(0.52 0 0)",
  "oklch(0.58 0 0)",
  "oklch(0.64 0 0)",
  "oklch(0.70 0 0)",
  "oklch(0.75 0 0)",
  "oklch(0.80 0 0)",
  "oklch(0.84 0 0)",
  "oklch(0.88 0 0)",
  "oklch(0.91 0 0)",
  "oklch(0.93 0 0)",
  "oklch(0.95 0 0)",
  "oklch(0.97 0 0)",
];

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-3xl font-bold tracking-tight">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function BarChart({ data, maxItems = 15 }: { data: SkillCount[]; maxItems?: number }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const sliced = data.slice(0, maxItems);
  const max = sliced[0]?.count || 1;

  return (
    <div className="space-y-1.5">
      {sliced.map((item, i) => (
        <div
          key={item.name}
          className="group flex items-center gap-3 cursor-default"
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <span className="text-xs text-muted-foreground w-24 shrink-0 text-right truncate" title={item.name}>
            {item.name}
          </span>
          <div className="flex-1 h-7 bg-secondary/50 rounded-md overflow-hidden relative">
            <div
              className="h-full rounded-md transition-all duration-500 ease-out"
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: SHADES[i % SHADES.length],
                opacity: hoveredIdx === null || hoveredIdx === i ? 1 : 0.3,
              }}
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium transition-opacity ${
              hoveredIdx === i ? "opacity-100" : "opacity-0"
            }`}>
              {item.count} {item.count === 1 ? "maker" : "makers"}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground w-8 text-right">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: SkillCount[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const top = data.slice(0, 8);
  const otherCount = data.slice(8).reduce((sum, d) => sum + d.count, 0);
  const items = otherCount > 0 ? [...top, { name: "Other", count: otherCount }] : top;
  const total = items.reduce((sum, d) => sum + d.count, 0);

  // Calculate SVG donut segments
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = items.map((item, i) => {
    const pct = item.count / total;
    const dashLength = pct * circumference;
    const dashOffset = -offset;
    offset += dashLength;
    return { ...item, pct, dashLength, dashOffset, color: SHADES[i % SHADES.length] };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-48 h-48 shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => (
            <circle
              key={seg.name}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIdx === i ? 28 : 24}
              strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
              strokeDashoffset={seg.dashOffset}
              className="transition-all duration-200 cursor-pointer"
              style={{ opacity: hoveredIdx === null || hoveredIdx === i ? 1 : 0.3 }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hoveredIdx !== null ? (
            <>
              <span className="text-2xl font-bold">{Math.round(segments[hoveredIdx].pct * 100)}%</span>
              <span className="text-xs text-muted-foreground">{segments[hoveredIdx].name}</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-xs text-muted-foreground">total skills</span>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((seg, i) => (
          <div
            key={seg.name}
            className="flex items-center gap-2 cursor-default"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-muted-foreground truncate">{seg.name}</span>
            <span className="text-xs font-medium ml-auto">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BubbleCloud({ data }: { data: SkillCount[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const top = data.slice(0, 20);
  const max = top[0]?.count || 1;
  const min = top[top.length - 1]?.count || 1;

  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {top.map((item, i) => {
        const ratio = max === min ? 1 : (item.count - min) / (max - min);
        const size = 28 + ratio * 48;
        return (
          <div
            key={item.name}
            className="rounded-full flex items-center justify-center cursor-default transition-all duration-200 hover:scale-110"
            style={{
              width: size + item.name.length * 6,
              height: size,
              backgroundColor: SHADES[i % SHADES.length],
              opacity: hoveredIdx === null || hoveredIdx === i ? 1 : 0.35,
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span className={`text-xs font-medium px-2 truncate ${i < 5 ? "text-background" : "text-foreground"}`}>
              {item.name}
              {hoveredIdx === i && <span className="ml-1 opacity-70">({item.count})</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SkillPairings({ profiles }: { profiles: Profile[] }) {
  const pairs = useMemo(() => {
    const pairMap = new Map<string, number>();
    profiles.forEach((p) => {
      const skills = p.skills?.slice(0, 10) || [];
      for (let i = 0; i < skills.length; i++) {
        for (let j = i + 1; j < skills.length; j++) {
          const a = skills[i] < skills[j] ? skills[i] : skills[j];
          const b = skills[i] < skills[j] ? skills[j] : skills[i];
          const key = `${a} + ${b}`;
          pairMap.set(key, (pairMap.get(key) || 0) + 1);
        }
      }
    });
    return Array.from(pairMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [profiles]);

  const max = pairs[0]?.count || 1;

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={pair.name} className="flex items-center gap-3">
          <span className="text-xs font-medium w-6 text-right text-muted-foreground">{i + 1}</span>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm">{pair.name}</span>
          </div>
          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(pair.count / max) * 100}%`,
                backgroundColor: SHADES[i % SHADES.length],
              }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground w-6 text-right">{pair.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, bio, skills, photo_url");
      setProfiles(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  const stats = useMemo(() => {
    const skillMap = new Map<string, number>();
    let totalSkills = 0;
    let membersWithSkills = 0;
    let membersWithBio = 0;

    profiles.forEach((p) => {
      if (p.bio?.trim()) membersWithBio++;
      if (p.skills && p.skills.length > 0) {
        membersWithSkills++;
        p.skills.forEach((skill) => {
          const normalized = skill.trim();
          if (normalized) {
            skillMap.set(normalized, (skillMap.get(normalized) || 0) + 1);
            totalSkills++;
          }
        });
      }
    });

    const skillCounts: SkillCount[] = Array.from(skillMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const avgSkills = membersWithSkills > 0
      ? (totalSkills / membersWithSkills).toFixed(1)
      : "0";

    return {
      totalMembers: profiles.length,
      uniqueSkills: skillCounts.length,
      avgSkills,
      membersWithBio,
      skillCounts,
      totalSkills,
    };
  }, [profiles]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 bg-secondary rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-secondary rounded animate-pulse w-72 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-80 bg-secondary rounded-xl animate-pulse" />
          <div className="h-80 bg-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-[28px] md:text-2xl font-bold md:font-semibold tracking-tight mb-0.5">
          Our Community
        </h1>
        <p className="text-[13px] md:text-sm text-muted-foreground">
          A live look at the skills, interests, and talent across MakersLounge.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Users} label="Members" value={stats.totalMembers} sub="in the community" />
        <StatCard icon={Lightbulb} label="Unique Skills" value={stats.uniqueSkills} sub="across all makers" />
        <StatCard icon={Briefcase} label="Avg Skills" value={stats.avgSkills} sub="per maker" />
        <StatCard icon={TrendingUp} label="Profiles" value={`${stats.membersWithBio}`} sub="with a bio" />
      </div>

      {/* Skill bubble cloud */}
      <div className="rounded-xl border border-border bg-background p-5 mb-6">
        <h2 className="text-sm font-semibold mb-1">Skill Cloud</h2>
        <p className="text-xs text-muted-foreground mb-3">Most popular skills, sized by frequency</p>
        <BubbleCloud data={stats.skillCounts} />
      </div>

      {/* Two-column charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Skill distribution donut */}
        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-semibold mb-1">Skill Distribution</h2>
          <p className="text-xs text-muted-foreground mb-4">How skills are spread across the community</p>
          <DonutChart data={stats.skillCounts} />
        </div>

        {/* Skill pairings */}
        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-semibold mb-1">Top Skill Combos</h2>
          <p className="text-xs text-muted-foreground mb-4">Most common skill pairings among makers</p>
          <SkillPairings profiles={profiles} />
        </div>
      </div>

      {/* Full bar chart */}
      <div className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-semibold mb-1">All Skills</h2>
        <p className="text-xs text-muted-foreground mb-4">Complete breakdown of skills in the community</p>
        <BarChart data={stats.skillCounts} maxItems={25} />
      </div>
    </div>
  );
}
