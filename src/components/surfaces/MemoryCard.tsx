"use client";

import { Layers, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { confidenceLabel, relativeTime, type Category, type Memory } from "@/lib/types";

const CATEGORY_TONE: Record<Category, string> = {
  preference: "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.1)] text-signal-green",
  workflow: "border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.1)] text-[#38BDF8]",
  project: "border-[rgba(129,140,248,0.3)] bg-[rgba(129,140,248,0.1)] text-[#818CF8]",
  constraint: "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] text-signal-amber",
  other: "border-[#2E2E2E] bg-surface-2 text-[#A1A1AA]",
};

const CONFIDENCE_TONE = {
  HIGH: "text-signal-green",
  MEDIUM: "text-signal-amber",
  LOW: "text-signal-red",
} as const;

export function ConfidenceMeter({ value }: { value: number }) {
  const label = confidenceLabel(value);
  return (
    <span className="inline-flex items-center gap-2" title={`Confidence score ${value.toFixed(2)}`}>
      <span aria-hidden className="flex h-2.5 items-end gap-[2px]">
        {[0.4, 0.65, 0.85].map((threshold, index) => (
          <span
            key={index}
            className={cn(
              "w-[3px] rounded-sm",
              index === 0 ? "h-1.5" : index === 1 ? "h-2" : "h-2.5",
              value >= threshold ? "bg-current" : "bg-[#2E2E2E]",
            )}
          />
        ))}
      </span>
      <span className={cn("font-mono text-[11px] font-semibold", CONFIDENCE_TONE[label])}>
        {value.toFixed(2)} {label}
      </span>
    </span>
  );
}

export function MemoryCard({
  memory,
  index,
  onInspect,
  onDelete,
  deleting,
  highlight,
  matchedOn,
}: {
  memory: Memory;
  index: number;
  onInspect: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  deleting?: boolean;
  /** Set while the card is freshly created or freshly retrieved. */
  highlight?: "new" | "matched" | null;
  matchedOn?: string[];
}) {
  return (
    <article
      className={cn(
        "corner-crosshair group relative flex flex-col rounded-xl border bg-surface-1 p-5 transition-all duration-200",
        highlight === "new"
          ? "border-[rgba(255,62,20,0.55)] shadow-[0_0_28px_rgba(255,62,20,0.16)]"
          : highlight === "matched"
            ? "border-[rgba(16,185,129,0.45)] shadow-[0_0_24px_rgba(16,185,129,0.12)]"
            : "border-[#1F1F1F] hover:border-[#2E2E2E]",
        deleting && "scale-[0.98] opacity-40",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-accent-orange">
          {String(index + 1).padStart(3, "0")}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
            CATEGORY_TONE[memory.category],
          )}
        >
          {memory.category}
        </span>
        {highlight === "new" ? (
          <span className="rounded-full bg-accent-orange px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black">
            New
          </span>
        ) : null}
        {highlight === "matched" ? (
          <span className="rounded-full border border-[rgba(16,185,129,0.4)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-signal-green">
            Retrieved
          </span>
        ) : null}
        <span className="ml-auto">
          <ConfidenceMeter value={memory.confidence} />
        </span>
      </div>

      {/* React escapes this by default; memory content is never injected as HTML. */}
      <p className="mt-4 text-[15px] font-medium leading-relaxed text-white">
        &ldquo;{memory.content}&rdquo;
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] text-[#52525B]">
        <span className="text-[#A1A1AA]">
          Source: <span className="text-white">{memory.source}</span>
        </span>
        <span aria-hidden>•</span>
        <span>{memory.tags.length > 0 ? memory.tags.map((tag) => `#${tag}`).join(", ") : "no tags"}</span>
        <span aria-hidden>•</span>
        <time dateTime={memory.createdAt}>{relativeTime(memory.createdAt)}</time>
      </div>

      {matchedOn && matchedOn.length > 0 ? (
        <p className="mt-3 rounded-md border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.06)] px-2.5 py-1.5 font-mono text-[11px] text-signal-green">
          matched on {matchedOn.join(", ")}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-2 border-t border-[#1F1F1F] pt-4">
        <Button variant="ghost" size="sm" onClick={() => onInspect(memory)}>
          <Layers className="h-3.5 w-3.5" aria-hidden />
          View lineage
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="ml-auto"
          onClick={() => onDelete(memory)}
          disabled={deleting}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </article>
  );
}
