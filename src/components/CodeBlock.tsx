"use client";

import { useState } from "react";

export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <figure className="relative overflow-hidden rounded-xl border border-zinc-800 bg-[#090a0f] shadow-sm">
      {/* Code header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/60 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/60" />
          </div>
          {caption ? (
            <span className="ml-2 font-mono text-[11px] text-zinc-400">
              {caption}
            </span>
          ) : (
            <span className="ml-2 font-mono text-[11px] text-zinc-500">code snippet</span>
          )}
        </div>

        <button
          type="button"
          onClick={copyCode}
          className="rounded px-2 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </figure>
  );
}
