"use client";

import { Check, Copy, Play, Terminal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export type ConsoleLine = {
  id: string;
  role: "user" | "agent" | "tool";
  text: string;
  tool?: string;
};

/**
 * The agent-facing panel on a demo site.
 *
 * Two paths, always distinguishable:
 *   1. A real agent in a WebMCP browser calls the registered tools itself. The
 *      user types the prompt into their agent sidebar — we show it to copy.
 *   2. No agent present: the button runs the identical tool handler and every
 *      resulting log line is stamped MANUAL. We never draw a fake agent turn.
 */
export function AgentConsole({
  surface,
  prompt,
  lines,
  onRun,
  busy,
  runLabel,
  supported,
  className,
  accent = "#FF3E14",
}: {
  surface: string;
  prompt: string;
  lines: ConsoleLine[];
  onRun: () => void;
  busy?: boolean;
  runLabel: string;
  supported: boolean;
  className?: string;
  accent?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard permission denied — the prompt is still on screen to read */
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#1F1F1F] bg-surface-1", className)}>
      <div className="flex items-center gap-2 border-b border-[#1F1F1F] px-4 py-2.5">
        <Terminal className="h-3.5 w-3.5" style={{ color: accent }} aria-hidden />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
          {surface} agent console
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]">
            {supported ? "Say this to your browser agent" : "Demo prompt"}
          </p>
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#2E2E2E] bg-surface-2 p-3">
            <p className="flex-1 text-sm leading-relaxed text-white">&ldquo;{prompt}&rdquo;</p>
            <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy prompt">
              {copied ? (
                <Check className="h-3.5 w-3.5 text-signal-green" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#52525B]">
            {supported
              ? `An agent in this browser can already see ${surface}'s tools. Ask it, and it will call them itself.`
              : "No agent detected in this browser. The button below runs the exact same tool handler an agent would call — every log line is stamped MANUAL."}
          </p>
        </div>

        <Button variant="primary" size="md" onClick={onRun} disabled={busy} className="w-full">
          <Play className="h-4 w-4" aria-hidden />
          {busy ? "Running tool…" : runLabel}
        </Button>

        {lines.length > 0 ? (
          <div className="max-h-72 space-y-2.5 overflow-y-auto border-t border-[#1F1F1F] pt-4">
            {lines.map((line) => (
              <div key={line.id} className="animate-fade-up">
                {line.role === "tool" ? (
                  <div className="rounded-lg border border-[rgba(255,62,20,0.28)] bg-[rgba(255,62,20,0.06)] p-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-orange">
                      WebMCP · {line.tool}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#D4D4D8]">
                      {line.text}
                    </p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "rounded-lg p-2.5 text-sm leading-relaxed",
                      line.role === "user"
                        ? "border border-[#2E2E2E] bg-surface-2 text-white"
                        : "text-[#A1A1AA]",
                    )}
                  >
                    <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#52525B]">
                      {line.role === "user" ? "you" : "agent"}
                    </span>
                    {line.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

let counter = 0;
export function consoleLine(role: ConsoleLine["role"], text: string, tool?: string): ConsoleLine {
  counter += 1;
  return { id: `line-${counter}`, role, text, tool };
}
