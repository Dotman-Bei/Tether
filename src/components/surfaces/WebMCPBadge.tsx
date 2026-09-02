"use client";

import { AlertTriangle, ChevronDown, Cpu } from "lucide-react";
import { useState } from "react";

import { StatusPill } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { WebMCPStatus } from "@/hooks/useWebMCP";

/**
 * Honest environment reporting.
 *
 * When a model context exists we name where we found it and list the tools we
 * registered. When it does not, we say so plainly; the build spec forbids
 * faking tool calls, so the UI must never imply an agent is present.
 */
export function WebMCPBadge({
  status,
  surface,
  className,
}: {
  status: WebMCPStatus;
  surface: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!status.checked) {
    return (
      <StatusPill tone="muted" pulse={false} className={className}>
        CHECKING WEBMCP…
      </StatusPill>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="group inline-flex items-center gap-2"
      >
        <StatusPill tone={status.supported ? "green" : "amber"} pulse={status.supported}>
          {status.supported
            ? `WEBMCP ACTIVE · ${status.toolNames.length} TOOLS`
            : `WEBMCP UNAVAILABLE · ${status.toolNames.length} TOOLS DECLARED`}
        </StatusPill>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[#52525B] transition-transform group-hover:text-white",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] animate-fade-up rounded-xl border border-[#2E2E2E] bg-surface-1 p-4 shadow-2xl">
          <div className="flex items-start gap-2.5">
            {status.supported ? (
              <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-signal-green" aria-hidden />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-amber" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                {status.supported
                  ? `${surface} tools are live`
                  : "WebMCP tools are unavailable in this browser"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA]">
                {status.supported ? (
                  <>
                    Registered on{" "}
                    <code className="font-mono text-accent-orange">{status.host}</code> via{" "}
                    <code className="font-mono text-accent-orange">{status.api}()</code>. An agent
                    in this page can discover and call them right now.
                  </>
                ) : (
                  <>
                    Open Tether in the <strong className="text-white">ChatGPT desktop app</strong>
                    &apos;s built-in browser, or in{" "}
                    <strong className="text-white">Google Chrome 149+</strong> with{" "}
                    <code className="font-mono text-accent-orange">
                      chrome://flags/#enable-webmcp-testing
                    </code>{" "}
                    enabled. The tool controls stay disabled until then.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-[#1F1F1F] pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]">
              Tools declared by {surface}
            </p>
            <ul className="mt-2 space-y-1">
              {status.toolNames.map((name) => (
                <li key={name} className="flex items-center gap-2 font-mono text-xs text-white">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      status.supported ? "bg-signal-green" : "bg-[#52525B]",
                    )}
                  />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
