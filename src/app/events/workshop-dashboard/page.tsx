"use client";

import { useState } from "react";

/* ── Data ── */
const stats = {
  totalCommunity: 512,
  approved: 49,
  declined: 15,
  checkedIn: 7,
  comakeCoupons: 13,
};

const phases = [
  { label: "Build", desc: "Building", count: 26, color: "bg-blue-500", ring: "ring-blue-500/30" },
  { label: "Spark", desc: "Ideating", count: 18, color: "bg-rose-400", ring: "ring-rose-400/30" },
  { label: "Momentum", desc: "Growing", count: 5, color: "bg-teal-400", ring: "ring-teal-400/30" },
];

const referralSources = [
  { label: "Direct Invite", count: 15, color: "from-blue-500 to-blue-400" },
  { label: "BYTE / TMU", count: 14, color: "from-teal-400 to-teal-300" },
  { label: "Social Media", count: 7, color: "from-amber-400 to-amber-300" },
  { label: "Friend", count: 7, color: "from-rose-400 to-rose-300" },
  { label: "Luma", count: 4, color: "from-indigo-400 to-indigo-300" },
  { label: "Other", count: 2, color: "from-zinc-500 to-zinc-400" },
];

const skills = [
  { label: "Web Development", have: 19, need: 12 },
  { label: "Community Building", have: 15, need: 9 },
  { label: "Design (UX/UI)", have: 12, need: 12 },
  { label: "AI Automations", have: 11, need: 20 },
  { label: "Mobile App Dev", have: 11, need: 14 },
  { label: "Social Media", have: 11, need: 10 },
  { label: "Event Planning", have: 10, need: 5 },
  { label: "Sales", have: 9, need: 9 },
  { label: "Pitching & Fundraising", have: 8, need: 8 },
  { label: "Filmmaking", have: 7, need: 4 },
];

const projects = [
  { name: "AI-powered hiring platform", maker: "Sammy" },
  { name: "Cybersecurity in healthcare", maker: "Jharana" },
  { name: "Trading bot (historical analysis)", maker: "Lav" },
  { name: "Chief of Staff Dashboard", maker: "Liberty" },
  { name: "Satellite collision prediction AI", maker: "Kashmala" },
  { name: "AI receipt scanner (Zenvoy)", maker: "Aayan" },
  { name: "Interactive 3D Globe", maker: "Adobea" },
  { name: "AI concierge for social life", maker: "Ayesha" },
  { name: "Matcha social & founder hub", maker: "Sharfenaz" },
  { name: "Voice Prompt Optimizer AI", maker: "Shekhar" },
  { name: "resumate.ca", maker: "Jacob" },
  { name: "SOON! Hackathon platform", maker: "Jack" },
  { name: "Finance tracker app", maker: "Arshiya" },
  { name: "F1 Driver guessing game", maker: "Rida" },
  { name: "Frailty index app", maker: "Tanvi" },
  { name: "ThoughtPlay & French Exam Prep", maker: "Brittany" },
  { name: "Timeclock for construction", maker: "Subha" },
  { name: "Newsletter via Claude", maker: "Stefanie" },
  { name: "Pitch deck builder", maker: "Monique" },
  { name: "Learnatocto.com", maker: "Kartik" },
];

/* ── Components ── */

function AnimatedNumber({ value }: { value: number }) {
  return <span className="tabular-nums">{value}</span>;
}

function PhaseRing({
  phase,
}: {
  phase: (typeof phases)[0];
}) {
  const total = phases.reduce((s, p) => s + p.count, 0);
  const pct = Math.round((phase.count / total) * 100);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="100" height="100" className="transform -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={`${phase.color.replace("bg-", "stroke-")}`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 1.5s ease-out",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{pct}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-white">{phase.label}</div>
        <div className="text-xs text-white/40">{phase.count} makers</div>
      </div>
    </div>
  );
}

export default function WorkshopDashboard() {
  const [activeTab, setActiveTab] = useState<"skills" | "needs">("skills");
  const maxSkill = Math.max(...skills.map((s) => s.have));
  const maxNeed = Math.max(...skills.map((s) => s.need));
  const maxRef = Math.max(...referralSources.map((s) => s.count));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-teal-400/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Live Dashboard
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-teal-300 bg-clip-text text-transparent">
              Claude Code Workshop
            </span>
          </h1>
          <p className="text-white/40 text-lg">
            MakersLounge Toronto #10 &middot; April 24, 2026
          </p>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Community", value: stats.totalCommunity, accent: "text-white", sub: "total invited" },
            { label: "Approved", value: stats.approved, accent: "text-teal-400", sub: "76% acceptance" },
            { label: "Checked In", value: stats.checkedIn, accent: "text-amber-400", sub: "and counting" },
            { label: "BYTE Members", value: stats.comakeCoupons, accent: "text-rose-400", sub: "COMAKE code" },
          ].map((s, i) => (
            <div key={i} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors">
              <div className={`text-4xl font-bold ${s.accent} mb-1`}>
                <AnimatedNumber value={s.value} />
              </div>
              <div className="text-sm font-medium text-white/60">{s.label}</div>
              <div className="text-xs text-white/30 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Phase + Referrals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Phases */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
            <h2 className="text-lg font-semibold mb-8">Builder Phases</h2>
            <div className="flex justify-around">
              {phases.map((p, i) => (
                <PhaseRing key={i} phase={p} />
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/[0.06] text-center text-sm text-white/50">
              <span className="text-white font-medium">53%</span> are actively building &middot;{" "}
              <span className="text-white font-medium">37%</span> ideating &middot;{" "}
              <span className="text-white font-medium">10%</span> growing
            </div>
          </div>

          {/* Referral Sources */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
            <h2 className="text-lg font-semibold mb-6">How They Found Us</h2>
            <div className="space-y-3">
              {referralSources.map((src, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-white/60 shrink-0">{src.label}</span>
                  <div className="flex-1 h-8 rounded-lg bg-white/[0.04] overflow-hidden">
                    <div
                      className={`h-full rounded-lg bg-gradient-to-r ${src.color}`}
                      style={{ width: `${(src.count / maxRef) * 100}%`, transition: "width 1s ease" }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold tabular-nums">{src.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills Supply & Demand */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Skills: Supply vs. Demand</h2>
            <div className="flex gap-1 p-1 rounded-lg bg-white/[0.04]">
              <button
                onClick={() => setActiveTab("skills")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "skills" ? "bg-teal-500/20 text-teal-400" : "text-white/40 hover:text-white/60"
                }`}
              >
                Have
              </button>
              <button
                onClick={() => setActiveTab("needs")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "needs" ? "bg-rose-500/20 text-rose-400" : "text-white/40 hover:text-white/60"
                }`}
              >
                Need
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
            {skills.map((sk, i) => {
              const value = activeTab === "skills" ? sk.have : sk.need;
              const max = activeTab === "skills" ? maxSkill : maxNeed;
              const gap = sk.need - sk.have;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-36 text-sm text-white/60 shrink-0 truncate">{sk.label}</span>
                  <div className="flex-1 h-7 rounded-md bg-white/[0.04] overflow-hidden relative">
                    <div
                      className={`h-full rounded-md transition-all duration-700 ${
                        activeTab === "skills"
                          ? "bg-gradient-to-r from-teal-500 to-teal-400"
                          : "bg-gradient-to-r from-rose-500 to-rose-400"
                      }`}
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-sm font-semibold tabular-nums">{value}</span>
                  {activeTab === "needs" && gap > 0 && (
                    <span className="text-xs text-rose-400/70 w-10">+{gap}</span>
                  )}
                  {activeTab === "needs" && gap <= 0 && (
                    <span className="text-xs text-teal-400/70 w-10">{gap === 0 ? "=" : gap}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Insight callout */}
          <div className="mt-8 p-5 rounded-xl bg-gradient-to-r from-blue-500/[0.08] to-teal-500/[0.04] border border-blue-500/10">
            <p className="text-sm text-white/70 leading-relaxed">
              <span className="text-blue-300 font-semibold">Matching opportunity:</span>{" "}
              AI Automations has the biggest gap &mdash; 20 people need it, 11 have it.
              Design and Sales are perfectly balanced. The room is genuinely complementary.
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 mb-12">
          <h2 className="text-lg font-semibold mb-2">What&apos;s Being Built</h2>
          <p className="text-sm text-white/40 mb-6">20 projects from tonight&apos;s makers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {projects.map((proj, i) => (
              <div
                key={i}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all"
              >
                <div className="text-sm text-white/80 font-medium leading-snug">{proj.name}</div>
                <div className="text-xs text-white/30 mt-1">{proj.maker}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pb-8">
          <div className="text-white/20 text-sm">
            makerslounge.ca &middot; Build. Connect. Create.
          </div>
        </footer>
      </div>
    </div>
  );
}
