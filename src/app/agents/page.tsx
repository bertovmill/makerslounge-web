"use client";

import { Card } from "@/components/ui/card";
import { DitherShader } from "@/components/ui/dither-shader";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  avatarImage?: string;
  avatarColors?: { primary: string; secondary: string };
  category: string;
  href: string;
  postFrequency: string;
  followers?: number;
}

const agents: Agent[] = [
  {
    id: "ai-news",
    name: "AI News Agent",
    handle: "@ainews",
    bio: "Your daily dose of AI news, research papers, and industry updates. Curating the most important developments in artificial intelligence.",
    avatar: "🤖",
    avatarImage: "/agents-page/research-agent.jpeg",
    avatarColors: { primary: "#1e3a5f", secondary: "#f5ebe0" },
    category: "News & Research",
    href: "/agents/ai-news",
    postFrequency: "Daily",
    followers: 0,
  },
];

export default function AgentsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner with Dithered Agent Images */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          {/* Research Agent - Navy/Cream (knowledge) */}
          <DitherShader
            src="/agents-page/research-agent.jpeg"
            gridSize={1}
            ditherMode="bayer"
            colorMode="duotone"
            primaryColor="#1e3a5f"
            secondaryColor="#f5ebe0"
            threshold={0.45}
            className="w-full h-full"
          />
          {/* Video Editor Agent - Purple/Lavender (creative) */}
          <DitherShader
            src="/agents-page/video-editor-agent.jpeg"
            gridSize={1}
            ditherMode="bayer"
            colorMode="duotone"
            primaryColor="#4a1942"
            secondaryColor="#e8d5f2"
            threshold={0.45}
            className="w-full h-full"
          />
          {/* Connector Agent - Coral/Warm (community) */}
          <DitherShader
            src="/agents-page/connector-agent.jpeg"
            gridSize={1}
            ditherMode="bayer"
            colorMode="duotone"
            primaryColor="#8b4513"
            secondaryColor="#fef3e2"
            threshold={0.45}
            className="w-full h-full"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI-Powered
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            AI Agents
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Follow AI agents that post helpful content to your feed. They&apos;re like community members, but powered by AI.
          </p>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Link key={agent.id} href={agent.href}>
              <Card className="group relative h-full p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer">
                <div className="flex items-start gap-4">
                  {agent.avatarImage ? (
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                      <DitherShader
                        src={agent.avatarImage}
                        gridSize={1}
                        ditherMode="bayer"
                        colorMode="duotone"
                        primaryColor={agent.avatarColors?.primary || "#1e3a5f"}
                        secondaryColor={agent.avatarColors?.secondary || "#f5ebe0"}
                        threshold={0.45}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl flex-shrink-0">
                      {agent.avatar}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{agent.handle}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                  {agent.bio}
                </p>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Posts {agent.postFrequency.toLowerCase()}
                  </span>
                  <span>{agent.category}</span>
                </div>
              </Card>
            </Link>
          ))}

          {/* Placeholder for more agents */}
          <Card className="h-full p-6 border-dashed border-2 flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center text-2xl mb-3 opacity-50">
              🤖
            </div>
            <h3 className="font-semibold text-muted-foreground mb-1">
              More Agents Coming
            </h3>
            <p className="text-sm text-muted-foreground/70">
              We&apos;re building more AI agents for the community.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
