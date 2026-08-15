"use client";

import { useEffect, useState } from "react";
import { Radio, Star, Wrench } from "lucide-react";

/**
 * Reads the agent's own `/eve/v1/info` route so the chips reflect what eve
 * actually discovered on disk. Adding a file under `agent/tools/`, `skills/`,
 * or `channels/` shows up here with no frontend change.
 */
type AgentInfo = {
  tools?: { available?: { name?: string; description?: string; origin?: string }[] };
  skills?: {
    static?: { name?: string; description?: string }[];
    dynamic?: { name?: string; description?: string }[];
  };
  channels?: { authored?: { name?: string }[] };
};

type Capability = {
  key: string;
  label: string;
  icon: typeof Wrench;
  items: { name: string; description?: string }[];
};

function titleize(name: string) {
  return name.replace(/[-_]/g, " ");
}

export function AgentCapabilities() {
  const [info, setInfo] = useState<AgentInfo | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/eve/v1/info")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setInfo(data as AgentInfo);
      })
      .catch(() => {
        /* the chips are decoration — never break the chat over them */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info) return null;

  // Framework tools (bash, grep, …) are eve's built-ins; the interesting ones
  // are what this agent adds, so those lead.
  const authoredTools =
    info.tools?.available?.filter((tool) => tool.origin === "authored") ?? [];
  const frameworkToolCount =
    (info.tools?.available?.length ?? 0) - authoredTools.length;

  const skills = [...(info.skills?.static ?? []), ...(info.skills?.dynamic ?? [])];
  const channels = Array.from(
    new Set((info.channels?.authored ?? []).map((channel) => channel.name).filter(Boolean))
  ) as string[];

  const capabilities: Capability[] = [
    {
      key: "tools",
      label: "Tools",
      icon: Wrench,
      items: authoredTools.map((tool) => ({
        name: tool.name ?? "unnamed",
        description: tool.description,
      })),
    },
    {
      key: "skills",
      label: "Skills",
      icon: Star,
      items: skills.map((skill) => ({
        name: skill.name ?? "unnamed",
        description: skill.description,
      })),
    },
    {
      key: "channels",
      label: "Channels",
      icon: Radio,
      items: channels.map((name) => ({
        name,
        description:
          name === "eve"
            ? "This chat, over the built-in HTTP API"
            : name === "slack"
              ? "Makers Lounge Slack — @mentions and DMs"
              : undefined,
      })),
    },
  ];

  const active = capabilities.find((capability) => capability.key === openKey);

  return (
    <div className="shrink-0 border-b border-[#e3ecf5] bg-[#f7fafd] px-4 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {capabilities.map(({ key, label, icon: Icon, items }) => {
          const isOpen = openKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setOpenKey(isOpen ? null : key)}
              aria-expanded={isOpen}
              title={`${items.length} ${label.toLowerCase()}`}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isOpen
                  ? "border-brand/40 bg-brand/10 text-brand-dark"
                  : "border-[#e3ecf5] bg-white text-ink-muted hover:border-brand/30 hover:text-brand-dark"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
              <span className="font-semibold">{items.length}</span>
            </button>
          );
        })}
        {frameworkToolCount > 0 && (
          <span className="text-[11px] text-ink-muted">
            +{frameworkToolCount} built-in
          </span>
        )}
      </div>

      {active && (
        <ul className="mt-2 space-y-1.5">
          {active.items.length === 0 && (
            <li className="text-[11px] text-ink-muted">
              None yet — add a file under <code>agent/{active.key}/</code>.
            </li>
          )}
          {active.items.map((item) => (
            <li key={item.name} className="text-[11px] leading-snug">
              <span className="font-mono font-semibold text-brand-dark">
                {titleize(item.name)}
              </span>
              {item.description && (
                <span className="text-ink-muted"> — {item.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
