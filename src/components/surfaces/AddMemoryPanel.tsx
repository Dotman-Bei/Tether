"use client";

import { ChevronDown, Plus, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { createMemory, logActivity } from "@/lib/client";
import { CATEGORIES, type Category } from "@/lib/types";

/**
 * The human counterpart to `store_context`.
 *
 * An agent can already write anything into the memory layer through the tool;
 * this is the same capability exposed to the person, routed through the same
 * API. It also makes the point that Tether is a general context store rather
 * than a fixed set of demo toggles — you can teach it anything, and DevForge
 * will pick up whatever it recognises.
 */

const SUGGESTIONS = [
  "I prefer pnpm over npm",
  "I prefer Tailwind CSS for styling",
  "I prefer Vite for new projects",
  "I prefer Remix over Next.js",
  "I always write tests with Vitest",
];

export function AddMemoryPanel({
  onAdded,
  source = "You",
  title = "Teach Tether something",
  description = "Add any context in your own words. DevForge will apply whatever it recognises.",
  toolName = "store_context",
}: {
  onAdded: () => void | Promise<void>;
  /** Which site is credited as having learned this. */
  source?: string;
  title?: string;
  description?: string;
  /** Named in the footer so the human path is traceable to a real tool. */
  toolName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("preference");
  const [tags, setTags] = useState("");
  const [confidence, setConfidence] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 3) {
      setError("Write at least a few words.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const parsedTags = tags
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 8);

      const { memory, duplicate } = await createMemory({
        content: trimmed,
        category,
        tags: parsedTags,
        source,
        confidence,
      });

      await logActivity({
        channel: source.toUpperCase() === "YOU" ? "TETHER" : source.toUpperCase(),
        label: duplicate ? "duplicate ignored" : "memory added by user",
        detail: `"${memory.content}"`,
        origin: "manual",
        status: duplicate ? "info" : "ok",
      });

      setResult(
        duplicate
          ? "Tether already knew that — nothing duplicated."
          : `Stored. Any participating site can now retrieve it.`,
      );
      setContent("");
      setTags("");
      await onAdded();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not store that memory.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#1F1F1F] bg-surface-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2"
      >
        <span className="rounded-lg border border-[rgba(255,62,20,0.3)] bg-[rgba(255,62,20,0.08)] p-1.5">
          <Plus className="h-4 w-4 text-accent-orange" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-bold tracking-[-0.02em] text-white">
            {title}
          </span>
          <span className="mt-0.5 block text-xs text-[#A1A1AA]">
            {description}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#52525B] transition-transform",
            open && "rotate-180 text-accent-orange",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <form onSubmit={submit} className="animate-fade-up border-t border-[#1F1F1F] p-5">
          <label
            htmlFor="new-memory-content"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]"
          >
            What should Tether remember?
          </label>
          <textarea
            id="new-memory-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={2}
            maxLength={400}
            placeholder="e.g. I prefer pnpm over npm"
            className="mt-2 w-full resize-none rounded-lg border border-[#2E2E2E] bg-[#0A0A0A] px-3 py-2.5 text-sm text-white placeholder:text-[#3F3F46] outline-none transition-colors focus:border-accent-orange"
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setContent(suggestion)}
                className="rounded-full border border-[#1F1F1F] px-2.5 py-1 font-mono text-[10px] text-[#71717A] transition-colors hover:border-[#2E2E2E] hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="new-memory-category"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]"
              >
                Category
              </label>
              <select
                id="new-memory-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
                className="mt-2 w-full rounded-lg border border-[#2E2E2E] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-white outline-none focus:border-accent-orange"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="new-memory-tags"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]"
              >
                Tags (comma separated)
              </label>
              <input
                id="new-memory-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="tooling, node"
                className="mt-2 w-full rounded-lg border border-[#2E2E2E] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-white placeholder:text-[#3F3F46] outline-none focus:border-accent-orange"
              />
            </div>

            <div>
              <label
                htmlFor="new-memory-confidence"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]"
              >
                Confidence · <span className="text-accent-orange">{confidence.toFixed(2)}</span>
              </label>
              <input
                id="new-memory-confidence"
                type="range"
                min={0.5}
                max={1}
                step={0.01}
                value={confidence}
                onChange={(event) => setConfidence(Number(event.target.value))}
                className="mt-3 w-full accent-[#FF3E14]"
              />
            </div>
          </div>

          {error ? <p className="mt-3 text-xs text-signal-red">{error}</p> : null}
          {result ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-signal-green">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {result}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" variant="primary" size="md" disabled={busy}>
              {busy ? "Storing…" : "Store memory"}
            </Button>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#3F3F46]">
              same path as {toolName} · manual invocation
            </span>
          </div>
        </form>
      ) : null}
    </div>
  );
}
