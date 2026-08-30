"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { confidenceLabel, type Memory } from "@/lib/types";

import { ConfidenceMeter } from "./MemoryCard";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#1F1F1F] py-3 last:border-b-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#52525B]">
        {label}
      </span>
      <span className="text-right text-sm text-white">{children}</span>
    </div>
  );
}

/**
 * Memory detail + source lineage.
 *
 * Lineage is the trust surface: which site wrote this, through which tool, at
 * what time, with what confidence. It is also where the user edits or removes
 * the record — the "human decides what stays" moment in the demo.
 */
export function MemoryDrawer({
  memory,
  onClose,
  onDelete,
  onSave,
}: {
  memory: Memory | null;
  onClose: () => void;
  onDelete: (memory: Memory) => void;
  onSave: (memory: Memory, patch: { content: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditing(false);
    setError(null);
    setDraft(memory?.content ?? "");
  }, [memory]);

  useEffect(() => {
    if (!memory) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [memory, onClose]);

  if (!memory) return null;

  const created = new Date(memory.createdAt);
  const edited = memory.updatedAt !== memory.createdAt;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(memory, { content: draft.trim() });
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Close memory detail"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Memory detail"
        className="relative flex h-full w-full max-w-md animate-fade-up flex-col overflow-y-auto border-l border-[#2E2E2E] bg-surface-1 shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#1F1F1F] bg-surface-1 px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]">
              Memory lineage
            </p>
            <p className="mt-0.5 font-mono text-sm text-white">{memory.id.slice(0, 8)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <div className="flex-1 px-6 py-5">
          {editing ? (
            <div>
              <label
                htmlFor="memory-content"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]"
              >
                Content
              </label>
              <textarea
                id="memory-content"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                maxLength={400}
                className="mt-2 w-full resize-none rounded-lg border border-[#2E2E2E] bg-surface-2 px-3 py-2.5 text-sm text-white outline-none focus:border-accent-orange"
              />
              <div className="mt-3 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || draft.trim().length < 3}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
              {error ? <p className="mt-2 text-xs text-signal-red">{error}</p> : null}
            </div>
          ) : (
            <blockquote className="rounded-lg border border-[#1F1F1F] bg-surface-2 p-4 text-[15px] leading-relaxed text-white">
              &ldquo;{memory.content}&rdquo;
            </blockquote>
          )}

          <div className="mt-6">
            <Row label="Created by">{memory.source}</Row>
            <Row label="Via tool">
              <code className="font-mono text-accent-orange">store_context</code>
            </Row>
            <Row label="At">
              {created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              <span className="ml-2 text-[#52525B]">{created.toLocaleDateString()}</span>
            </Row>
            <Row label="Category">{memory.category}</Row>
            <Row label="Tags">
              {memory.tags.length > 0 ? memory.tags.map((tag) => `#${tag}`).join(" ") : "—"}
            </Row>
            <Row label="Confidence">
              <ConfidenceMeter value={memory.confidence} />
            </Row>
            <Row label="Scope">{memory.scope}</Row>
            {edited ? (
              <Row label="Last updated">{new Date(memory.updatedAt).toLocaleTimeString()}</Row>
            ) : null}
          </div>

          <div className="mt-6 rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]">
              Who can read this
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">
              Any participating site that calls{" "}
              <code className="font-mono text-accent-orange">retrieve_context</code> from your
              browser session can read this memory. Tether only exposes memories you have allowed to
              persist — deleting it here removes it everywhere, immediately.
            </p>
          </div>

          <div
            className={cn(
              "mt-4 rounded-lg border p-3 font-mono text-[11px]",
              confidenceLabel(memory.confidence) === "HIGH"
                ? "border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.06)] text-signal-green"
                : "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.06)] text-signal-amber",
            )}
          >
            {confidenceLabel(memory.confidence) === "HIGH"
              ? "High confidence — stated directly and unambiguously by the user."
              : "Medium confidence — inferred from context; verify before relying on it."}
          </div>
        </div>

        <footer className="sticky bottom-0 flex items-center gap-2 border-t border-[#1F1F1F] bg-surface-1 px-6 py-4">
          <Button variant="outline" size="md" onClick={() => setEditing((value) => !value)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {editing ? "Stop editing" : "Edit"}
          </Button>
          <Button variant="danger" size="md" className="ml-auto" onClick={() => onDelete(memory)}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete memory
          </Button>
        </footer>
      </aside>
    </div>
  );
}
