"use client";

import { useEffect, useRef } from "react";

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "running" | "complete" | "error";
  timestamp: number;
}

export interface AgentTurn {
  turn: number;
  thinking?: string;
  toolCalls: ToolCall[];
  timestamp: number;
}

interface AgentWorkflowProps {
  turns: AgentTurn[];
  currentPhase: string;
  isRunning: boolean;
}

const TOOL_ICONS: Record<string, string> = {
  get_all_contacts: "📋",
  search_contacts: "🔍",
  get_contact_by_name: "👤",
  propose_groups: "✨",
  verify_groups: "✓",
  submit_final_groups: "🚀",
};

const TOOL_LABELS: Record<string, string> = {
  get_all_contacts: "Get All Contacts",
  search_contacts: "Search Contacts",
  get_contact_by_name: "Get Contact",
  propose_groups: "Propose Groups",
  verify_groups: "Verify Groups",
  submit_final_groups: "Submit Final",
};

function formatToolInput(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "search_contacts":
      return `field: "${input.field}", contains: "${input.contains}"`;
    case "get_contact_by_name":
      return `name: "${input.name}"`;
    case "propose_groups":
      const groups = input.groups as Array<{ members: string[] }>;
      return `${groups?.length || 0} groups`;
    default:
      return "";
  }
}

function formatToolResult(name: string, result: unknown): string {
  if (!result) return "";

  const r = result as Record<string, unknown>;

  switch (name) {
    case "get_all_contacts":
      return `${r.count} contacts, ${(r.columns as string[])?.length || 0} columns`;
    case "search_contacts":
      const matches = result as Array<unknown>;
      return `${matches.length} matches`;
    case "get_contact_by_name":
      return r ? "Found" : "Not found";
    case "propose_groups":
      return r.accepted ? "Accepted" : "Rejected";
    case "verify_groups":
      const v = r as { valid: boolean; issues: string[] };
      return v.valid ? "Valid ✓" : `${v.issues?.length || 0} issues`;
    case "submit_final_groups":
      const s = r as { success: boolean; groups: Array<unknown> };
      return s.success ? `${s.groups?.length || 0} groups submitted` : "Failed";
    default:
      return JSON.stringify(result).slice(0, 50);
  }
}

export default function AgentWorkflow({ turns, currentPhase, isRunning }: AgentWorkflowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  if (turns.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-sm font-medium">Agent Workflow</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {turns.length} turn{turns.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Workflow visualization */}
      <div
        ref={scrollRef}
        className="max-h-[400px] overflow-y-auto p-4"
      >
        <div className="space-y-4">
          {turns.map((turn, turnIdx) => (
            <div key={turn.turn} className="relative">
              {/* Turn indicator */}
              <div className="flex items-start gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {turn.turn}
                  </div>
                  {turnIdx < turns.length - 1 && (
                    <div className="w-px h-full bg-border/50 mt-1 min-h-[20px]" />
                  )}
                </div>

                {/* Turn content */}
                <div className="flex-1 pb-2">
                  {/* Thinking (if any) */}
                  {turn.thinking && (
                    <div className="mb-3 p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground italic">
                      {turn.thinking.slice(0, 150)}{turn.thinking.length > 150 ? "..." : ""}
                    </div>
                  )}

                  {/* Tool calls */}
                  <div className="space-y-2">
                    {turn.toolCalls.map((tool) => (
                      <div
                        key={tool.id}
                        className={`border rounded-lg overflow-hidden transition-all ${
                          tool.status === "running"
                            ? "border-primary/50 bg-primary/5"
                            : tool.status === "complete"
                            ? "border-border/50 bg-background"
                            : tool.status === "error"
                            ? "border-red-500/50 bg-red-500/5"
                            : "border-border/30 bg-muted/20"
                        }`}
                      >
                        {/* Tool header */}
                        <div className="px-3 py-2 flex items-center justify-between bg-muted/20">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{TOOL_ICONS[tool.name] || "🔧"}</span>
                            <span className="text-sm font-medium">
                              {TOOL_LABELS[tool.name] || tool.name}
                            </span>
                            {tool.status === "running" && (
                              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>
                          {tool.status === "complete" && (
                            <span className="text-xs text-emerald-600 font-medium">Done</span>
                          )}
                        </div>

                        {/* Tool details */}
                        <div className="px-3 py-2 text-xs space-y-1">
                          {/* Input */}
                          {formatToolInput(tool.name, tool.input) && (
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground shrink-0">Input:</span>
                              <code className="text-foreground bg-muted/50 px-1 rounded">
                                {formatToolInput(tool.name, tool.input)}
                              </code>
                            </div>
                          )}

                          {/* Result */}
                          {tool.result !== undefined && (
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground shrink-0">Result:</span>
                              <span className={`font-medium ${
                                tool.name === "verify_groups" && (tool.result as { valid: boolean })?.valid
                                  ? "text-emerald-600"
                                  : tool.name === "verify_groups"
                                  ? "text-amber-600"
                                  : "text-foreground"
                              }`}>
                                {formatToolResult(tool.name, tool.result)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading state for next turn */}
          {isRunning && turns.length > 0 && (
            <div className="flex items-center gap-3 pl-9 text-xs text-muted-foreground">
              <div className="w-3 h-3 border-2 border-primary/50 border-t-transparent rounded-full animate-spin" />
              <span>Agent thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer with phase */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/20 text-xs text-muted-foreground">
        Current phase: <span className="text-foreground font-medium capitalize">{currentPhase}</span>
      </div>
    </div>
  );
}
