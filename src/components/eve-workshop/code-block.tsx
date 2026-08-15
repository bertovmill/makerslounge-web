"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CodeBlock({
  lines,
  copyText,
  className,
}: {
  lines: string[];
  copyText?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const text = copyText ?? lines.filter((l) => !l.trim().startsWith("#")).join("\n").trim();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <pre
      className={cn(
        "relative mt-4 overflow-x-auto rounded-xl bg-ink p-5 font-mono text-[15px] leading-7 text-code-text",
        className,
      )}
    >
      <button
        onClick={copy}
        className="absolute top-2.5 right-2.5 cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      {lines.map((line, i) => (
        <span key={i} className={line.trim().startsWith("#") ? "text-code-comment" : undefined}>
          {line}
          {"\n"}
        </span>
      ))}
    </pre>
  );
}
