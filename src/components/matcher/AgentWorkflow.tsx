"use client";

import { useEffect, useRef, useState } from "react";

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
  get_all_contacts: "Loading contacts",
  search_contacts: "Searching",
  get_contact_by_name: "Looking up",
  propose_groups: "Creating groups",
  verify_groups: "Verifying",
  submit_final_groups: "Finalizing",
};

function formatResult(name: string, result: unknown): { text: string; success: boolean } {
  if (!result) return { text: "", success: true };

  const r = result as Record<string, unknown>;

  switch (name) {
    case "get_all_contacts":
      return { text: `${r.count} people`, success: true };
    case "search_contacts":
      const matches = result as Array<unknown>;
      return { text: `${matches.length} found`, success: matches.length > 0 };
    case "get_contact_by_name":
      return { text: r ? "Found" : "Not found", success: !!r };
    case "propose_groups":
      return { text: r.accepted ? "Ready" : "Rejected", success: !!r.accepted };
    case "verify_groups":
      const v = r as { valid: boolean };
      return { text: v.valid ? "Passed" : "Issues found", success: v.valid };
    case "submit_final_groups":
      const s = r as { success: boolean; groups: Array<unknown> };
      return { text: s.success ? `${s.groups?.length} groups` : "Failed", success: s.success };
    default:
      return { text: "Done", success: true };
  }
}

function ThinkingBubble({ text, isLatest }: { text: string; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(isLatest);
  const isLong = text.length > 100;
  const displayText = expanded || !isLong ? text : text.slice(0, 100) + "...";

  return (
    <div
      className="px-4 py-2.5 bg-muted/40 border-l-2 border-primary/30 text-sm text-muted-foreground italic cursor-pointer hover:bg-muted/60 transition-colors"
      onClick={() => isLong && setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span className="text-primary/60 shrink-0">💭</span>
        <span className="leading-relaxed">{displayText}</span>
      </div>
      {isLong && (
        <button className="text-xs text-primary/60 mt-1 ml-6 hover:text-primary">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default function AgentWorkflow({ turns, isRunning }: AgentWorkflowProps) {
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
      <div
        ref={scrollRef}
        className="max-h-[300px] overflow-y-auto"
      >
        <div className="divide-y divide-border/30">
          {turns.map((turn, turnIndex) => (
            <div key={turn.turn}>
              {/* Thinking bubble */}
              {turn.thinking && (
                <ThinkingBubble
                  text={turn.thinking}
                  isLatest={turnIndex === turns.length - 1}
                />
              )}

              {/* Tool calls for this turn */}
              {turn.toolCalls.map((tool) => {
                const result = formatResult(tool.name, tool.result);
                return (
                  <div
                    key={tool.id}
                    className={`px-4 py-3 flex items-center justify-between transition-colors ${
                      tool.status === "running" ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{TOOL_ICONS[tool.name] || "🔧"}</span>
                      <span className="text-sm">
                        {TOOL_LABELS[tool.name] || tool.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {tool.status === "running" ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : tool.result !== undefined ? (
                        <span className={`text-xs font-medium ${
                          result.success ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          {result.text}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Thinking indicator */}
          {isRunning && (
            <div className="px-4 py-3 flex items-center gap-3 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
