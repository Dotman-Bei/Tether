"use client";

import { Check, Copy, MonitorSmartphone, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";

const FLAG_URL = "chrome://flags/#enable-webmcp-testing";

/**
 * Shown on every surface when the page has no model context.
 *
 * Tether's whole premise is that a site hands an agent real tools. If the
 * tool-driven flows still ran without an agent present, WebMCP would look
 * optional, so the run controls are disabled here and this notice names the
 * two environments that actually support it rather than gesturing at a
 * "supported environment" the reader has to go and look up.
 */
export function EnvironmentNotice({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  const copyFlag = async () => {
    try {
      await navigator.clipboard.writeText(FLAG_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the URL is on screen to type manually */
    }
  };

  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.06)] p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] p-1.5">
          <TriangleAlert className="h-4 w-4 text-signal-amber" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold tracking-[-0.02em] text-white">
            This browser does not support WebMCP
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">
            Tether&apos;s tools are registered on the page&apos;s model context, which only exists
            in an agent-capable browser. The tool controls on this page are disabled until you open
            it in one of these:
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#2E2E2E] bg-[#0A0A0A] p-4">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="h-3.5 w-3.5 text-accent-orange" aria-hidden />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                  Option 1 · ChatGPT desktop
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">
                Open this URL inside the ChatGPT desktop app&apos;s built-in browser. It supports
                WebMCP by default, with nothing to configure.
              </p>
            </div>

            <div className="rounded-lg border border-[#2E2E2E] bg-[#0A0A0A] p-4">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="h-3.5 w-3.5 text-accent-orange" aria-hidden />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                  Option 2 · Google Chrome 149+
                </span>
              </div>
              <ol className="mt-2 space-y-1 text-xs leading-relaxed text-[#A1A1AA]">
                <li>1. Open the flag below</li>
                <li>2. Set it to Enabled</li>
                <li>3. Restart Chrome, then reload this page</li>
              </ol>
              <div className="mt-2.5 flex items-center gap-2 rounded-md border border-[#1F1F1F] bg-canvas px-2.5 py-1.5">
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-accent-orange">
                  {FLAG_URL}
                </code>
                <button
                  type="button"
                  onClick={copyFlag}
                  aria-label="Copy the Chrome flag URL"
                  className="shrink-0 text-[#52525B] transition-colors hover:text-white"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-signal-green" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#52525B]">
                Chrome blocks pasting a chrome:// link, so copy it and type or paste it into the
                address bar yourself.
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#52525B]">
            You can still browse Tether and inspect or delete stored memories. Only the
            agent-driven flows require WebMCP.
          </p>
        </div>
      </div>
    </div>
  );
}
