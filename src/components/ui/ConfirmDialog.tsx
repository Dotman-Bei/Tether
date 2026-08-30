"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "./primitives";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md animate-fade-up rounded-xl border border-[#2E2E2E] bg-surface-1 p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] p-2">
            <AlertTriangle className="h-4 w-4 text-signal-red" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold tracking-[-0.02em] text-white">{title}</h3>
            <div className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{body}</div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onCancel} disabled={busy}>
            Keep it
          </Button>
          <Button variant="danger" size="md" onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
