import { Database, Globe, ShieldCheck } from "lucide-react";

import { EqualizerBars, Panel, Section, SectionHeading } from "@/components/ui/primitives";

function FlowNode({
  index,
  title,
  subtitle,
  icon,
  accent,
}: {
  index: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative flex-1 rounded-xl border border-[#1F1F1F] bg-surface-1 p-5">
      <div className="flex items-center gap-2.5">
        <span className="rounded-lg border border-[#2E2E2E] bg-surface-2 p-1.5">{icon}</span>
        <span className="font-mono text-[11px] font-bold tracking-[0.1em]" style={{ color: accent }}>
          [ {index} ]
        </span>
      </div>
      <h3 className="mt-3 font-display text-base font-bold tracking-[-0.02em] text-white">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-[#A1A1AA]">{subtitle}</p>
    </div>
  );
}

/** Animated dashed connector, direction-aware. */
function Connector({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 px-2 py-3 lg:py-0">
      <svg viewBox="0 0 80 12" className="h-3 w-20 rotate-90 lg:rotate-0" aria-hidden>
        <line
          x1="0"
          y1="6"
          x2="72"
          y2="6"
          stroke="#FF3E14"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          className="animate-flow-dash"
        />
        <path d="M72 2 L80 6 L72 10 Z" fill="#FF3E14" />
      </svg>
      <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.12em] text-accent-orange">
        {label}
      </span>
    </div>
  );
}

export function ArchitectureSection() {
  return (
    <Section id="architecture" className="py-20 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          tag="INTRODUCING TETHER"
          glyph="↗"
          tone="orange"
          title="Shared context. Local control. Engineered for agents."
          subtitle="WebMCP gives each site a way to expose real capabilities to an agent. Tether is the persistence layer those capabilities read from and write to."
        />
        <EqualizerBars className="hidden sm:flex" count={32} />
      </div>

      {/* Flow diagram --------------------------------------------------- */}
      <div className="mt-12 flex flex-col items-stretch lg:flex-row lg:items-center">
        <FlowNode
          index="01"
          title="Participating sites"
          subtitle="DesignLab and DevForge each register their own WebMCP tools with the page's model context. An agent discovers them like any other page capability."
          icon={<Globe className="h-4 w-4 text-[#818CF8]" aria-hidden />}
          accent="#818CF8"
        />
        <Connector label="WebMCP tool call" />
        <FlowNode
          index="02"
          title="Tether persistence layer"
          subtitle="Next.js route handlers validate every input with Zod and write structured memories to Postgres. One contract, any number of sites."
          icon={<Database className="h-4 w-4 text-accent-orange" aria-hidden />}
          accent="#FF3E14"
        />
        <Connector label="inspect / delete" />
        <FlowNode
          index="03"
          title="Human governance plane"
          subtitle="The user sees every memory, its source lineage, and its confidence — and can delete any of it permanently, at any time."
          icon={<ShieldCheck className="h-4 w-4 text-signal-green" aria-hidden />}
          accent="#10B981"
        />
      </div>

      <Panel className="mt-4 px-5 py-4">
        <p className="text-sm leading-relaxed text-[#A1A1AA]">
          <span className="font-semibold text-white">To be precise:</span> WebMCP does not carry
          memory between sites on its own. It is the interface that lets each page hand an agent
          real tools. Tether is the shared backplane those tools read from and write to — which is
          what makes context earned on one site useful on the next.
        </p>
      </Panel>
    </Section>
  );
}
