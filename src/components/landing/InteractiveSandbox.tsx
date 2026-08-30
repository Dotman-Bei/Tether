"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

import { DesignLab } from "@/components/surfaces/DesignLab";
import { DevForge } from "@/components/surfaces/DevForge";
import { TelemetryStream } from "@/components/surfaces/TelemetryStream";
import { TetherControlPlane } from "@/components/surfaces/TetherControlPlane";
import { Section, SectionHeading } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const TABS = [
  { id: "tether", label: "01. TETHER CONTROL PLANE", href: "/dashboard" },
  { id: "designlab", label: "02. DESIGNLAB (PRODUCER)", href: "/designlab" },
  { id: "devforge", label: "03. DEVFORGE (CONSUMER)", href: "/devforge" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * The whole cross-site workflow in one viewport.
 *
 * Only the active surface is mounted, so the tools registered with the page's
 * model context are exactly the tools of the site you are looking at: the same
 * thing that happens when you navigate to that site's own route.
 */
export function InteractiveSandbox() {
  const [tab, setTab] = useState<TabId>("designlab");
  const active = TABS.find((item) => item.id === tab)!;

  return (
    <Section id="sandbox" className="py-20 sm:py-24">
      <SectionHeading
        tag="LIVE DEMO SANDBOX"
        glyph="⎔"
        tone="orange"
        title="Teach one site. Watch another use it."
        subtitle="Three real surfaces sharing one memory layer. Store a preference in DesignLab, switch tabs, and DevForge configures a project from it, with no preferences entered there."
      />

      <div className="mt-10 flex flex-col items-center gap-3">
        <div
          role="tablist"
          aria-label="Demo surfaces"
          className="flex w-full max-w-2xl flex-col gap-1.5 rounded-xl border border-[#1F1F1F] bg-surface-1 p-1.5 sm:flex-row sm:items-center sm:justify-center sm:gap-2"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.06em] transition-colors sm:text-xs",
                tab === item.id
                  ? "bg-accent-orange text-black"
                  : "text-[#A1A1AA] hover:bg-surface-2 hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Link
          href={active.href}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#52525B] transition-colors hover:text-accent-orange"
        >
          Open {active.id} on its own route
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-5 sm:p-8">
        {tab === "tether" ? <TetherControlPlane embedded /> : null}
        {tab === "designlab" ? <DesignLab embedded /> : null}
        {tab === "devforge" ? <DevForge embedded /> : null}
      </div>

      <TelemetryStream className="mt-5" height="h-56" />

      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[#3F3F46]">
        Every line above is a real API round-trip. Nothing here is pre-recorded.
      </p>
    </Section>
  );
}
