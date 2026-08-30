"use client";

import { Radio, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { fetchActivity, resetSandbox, subscribe } from "@/lib/client";
import type { ActivityEvent } from "@/lib/types";

const CHANNEL_COLORS: Record<string, string> = {
  WEBMCP: "text-accent-orange",
  TETHER: "text-signal-green",
  DESIGNLAB: "text-[#818CF8]",
  DEVFORGE: "text-[#38BDF8]",
  AGENT: "text-white",
};

const ORIGIN_LABEL: Record<ActivityEvent["origin"], string> = {
  agent: "AGENT",
  manual: "MANUAL",
  system: "SYSTEM",
};

function timestamp(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(
    date.getMilliseconds(),
    3,
  )}`;
}

/**
 * The live WebMCP event log.
 *
 * This is the single most important component for the demo video: it makes an
 * otherwise invisible agent → tool → API → database round-trip legible on
 * camera. Events are server-persisted, so a call made in the DesignLab tab
 * shows up in the Tether tab.
 */
export function TelemetryStream({
  className,
  height = "h-64",
  showReset = true,
}: {
  className?: string;
  height?: string;
  showReset?: boolean;
}) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [resetting, setResetting] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await fetchActivity(80);
        if (active) {
          setEvents(next);
          setReady(true);
        }
      } catch {
        if (active) setReady(true);
      }
    };

    void load();
    const timer = setInterval(() => void load(), 2000);
    const unsubscribe = subscribe(() => void load());
    return () => {
      active = false;
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  // Oldest first reads like a terminal; keep the newest line in view.
  const ordered = useMemo(() => [...events].reverse(), [events]);

  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [ordered.length]);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetSandbox();
      setEvents([]);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#080808]", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-[#1F1F1F] bg-surface-1 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-accent-orange" aria-hidden />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
            WebMCP telemetry
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#52525B]">
            {ordered.length} events
          </span>
        </div>
        {showReset ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={resetting || ordered.length === 0}
            title="Clear all memories and telemetry for a clean demo take"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Reset sandbox
          </Button>
        ) : null}
      </div>

      <div
        ref={scroller}
        className={cn("overflow-y-auto overflow-x-auto p-4 font-mono text-[13px] leading-6", height)}
        role="log"
        aria-live="polite"
        aria-label="WebMCP activity stream"
      >
        {!ready ? (
          <p className="text-[#3F3F46]">Connecting to Tether event stream…</p>
        ) : ordered.length === 0 ? (
          <p className="text-[#3F3F46]">
            Awaiting tool activity. Every WebMCP call across DesignLab, DevForge, and Tether prints
            here.
            <span className="ml-1 inline-block animate-blink text-accent-orange">▌</span>
          </p>
        ) : (
          <div className="min-w-max space-y-0.5">
            {ordered.map((event) => (
              <div key={event.id} className="flex animate-fade-up gap-3 whitespace-nowrap">
                <span className="shrink-0 text-[#3F3F46]">[{timestamp(event.createdAt)}]</span>
                <span
                  className={cn(
                    "w-[5.5rem] shrink-0 font-semibold uppercase",
                    CHANNEL_COLORS[event.channel.toUpperCase()] ?? "text-[#A1A1AA]",
                  )}
                >
                  {event.channel.toUpperCase()}
                </span>
                <span
                  className={cn(
                    "shrink-0",
                    event.status === "error"
                      ? "text-signal-red"
                      : event.status === "info"
                        ? "text-signal-amber"
                        : "text-white",
                  )}
                >
                  {event.label}
                </span>
                {event.detail ? <span className="text-[#71717A]">— {event.detail}</span> : null}
                <span className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-[#3F3F46]">
                  {ORIGIN_LABEL[event.origin]}
                </span>
              </div>
            ))}
            <div className="flex gap-3 text-accent-orange">
              <span className="animate-blink">▌</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
