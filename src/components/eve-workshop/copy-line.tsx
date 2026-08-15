"use client";

import { useState } from "react";

export function CopyLine({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-[#e3ecf5] bg-white px-4 py-2.5 text-base text-ink-muted italic ${className ?? ""}`}
    >
      <span className="flex-1">&ldquo;{text}&rdquo;</span>
      <button
        onClick={copy}
        className="shrink-0 cursor-pointer rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-dark not-italic hover:bg-brand/20"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
