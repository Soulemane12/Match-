"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-3 text-xs font-semibold text-zinc-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 ${className}`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
