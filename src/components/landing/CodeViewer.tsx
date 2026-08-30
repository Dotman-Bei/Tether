"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";

export type Snippet = { id: string; label: string; file: string; code: string };

/** Minimal token painter — enough colour to read, no syntax-highlighter dependency. */
function highlight(line: string): React.ReactNode {
  if (/^\s*(\/\/|\/\*|\*)/.test(line)) {
    return <span className="text-[#3F3F46]">{line}</span>;
  }

  const parts = line.split(/("(?:[^"\\]|\\.)*")/g);
  return parts.map((part, index) => {
    if (part.startsWith('"')) {
      return (
        <span key={index} className="text-[#86EFAC]">
          {part}
        </span>
      );
    }
    const words = part.split(
      /\b(const|await|async|function|return|export|import|from|type|if|new|void)\b/g,
    );
    return words.map((word, wordIndex) =>
      /^(const|await|async|function|return|export|import|from|type|if|new|void)$/.test(word) ? (
        <span key={`${index}-${wordIndex}`} className="text-[#FF8A6B]">
          {word}
        </span>
      ) : (
        <span key={`${index}-${wordIndex}`}>{word}</span>
      ),
    );
  });
}

export function CodeViewer({ snippets, className }: { snippets: Snippet[]; className?: string }) {
  const [activeId, setActiveId] = useState(snippets[0]?.id);
  const [copied, setCopied] = useState(false);
  const active = snippets.find((snippet) => snippet.id === activeId) ?? snippets[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — code is still selectable on screen */
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#080808]", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-[#1F1F1F] bg-surface-1 px-2 py-2">
        {snippets.map((snippet) => (
          <button
            key={snippet.id}
            type="button"
            onClick={() => setActiveId(snippet.id)}
            className={cn(
              "rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors",
              snippet.id === active.id
                ? "bg-surface-3 text-white"
                : "text-[#52525B] hover:text-[#A1A1AA]",
            )}
          >
            {snippet.label}
          </button>
        ))}
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="ml-auto rounded-md p-1.5 text-[#52525B] transition-colors hover:text-white"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-signal-green" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-[#141414] px-4 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#3F3F46]">
          {active.file}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#3F3F46]">
          verbatim from the repo
        </span>
      </div>

      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.65] text-[#D4D4D8]">
        <code>
          {active.code.split("\n").map((line, index) => (
            <div key={index} className="flex">
              <span className="mr-4 w-6 shrink-0 select-none text-right text-[#262626]">
                {index + 1}
              </span>
              <span className="min-w-0 whitespace-pre">{highlight(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
