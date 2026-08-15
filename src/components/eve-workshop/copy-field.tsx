"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="rounded-2xl border border-[#e3ecf5] bg-white p-5 shadow-sm">
      <p className="mb-2 text-xs font-bold tracking-[0.18em] text-ink-muted uppercase">{label}</p>
      <div className="flex items-center gap-3">
        <span
          className={`flex-1 truncate text-2xl font-extrabold tracking-tight text-ink md:text-3xl ${
            mono ? "font-mono tracking-normal" : ""
          }`}
        >
          {value}
        </span>
        <button
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-brand/10 px-3.5 py-2 text-sm font-semibold text-brand-dark hover:bg-brand/20"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
