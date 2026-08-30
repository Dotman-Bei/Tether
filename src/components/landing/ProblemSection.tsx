import { Section, SectionHeading } from "@/components/ui/primitives";

/** Tactical radar HUD: concentric rings, sweep arm, crosshairs, target lock. */
function RadarHUD() {
  const rings = [42, 78, 114, 150];

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]">
      <div aria-hidden className="bg-line-grid absolute inset-0" />

      <svg viewBox="0 0 340 340" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF3E14" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FF3E14" stopOpacity="0" />
          </linearGradient>
        </defs>

        {rings.map((r) => (
          <circle
            key={r}
            cx="170"
            cy="170"
            r={r}
            fill="none"
            stroke="#242424"
            strokeWidth="1"
            strokeDasharray={r === 150 ? "3 5" : undefined}
          />
        ))}

        <line x1="170" y1="10" x2="170" y2="330" stroke="#1F1F1F" strokeWidth="1" />
        <line x1="10" y1="170" x2="330" y2="170" stroke="#1F1F1F" strokeWidth="1" />

        {/* Rotating sweep arm. */}
        <g className="origin-center animate-radar-sweep" style={{ transformOrigin: "170px 170px" }}>
          <path d="M170 170 L170 20 A150 150 0 0 1 275 65 Z" fill="url(#sweep)" />
          <line x1="170" y1="170" x2="170" y2="20" stroke="#FF3E14" strokeOpacity="0.65" strokeWidth="1.5" />
        </g>

        {/* Target lock on the "context void". */}
        <g>
          <circle cx="228" cy="118" r="5" fill="#FF3E14" />
          <circle cx="228" cy="118" r="5" fill="none" stroke="#FF3E14" strokeWidth="1.5">
            <animate attributeName="r" values="5;18;5" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <line x1="212" y1="118" x2="222" y2="118" stroke="#FF3E14" strokeWidth="1.5" />
          <line x1="234" y1="118" x2="244" y2="118" stroke="#FF3E14" strokeWidth="1.5" />
          <line x1="228" y1="102" x2="228" y2="112" stroke="#FF3E14" strokeWidth="1.5" />
          <line x1="228" y1="124" x2="228" y2="134" stroke="#FF3E14" strokeWidth="1.5" />
        </g>

        {/* Faint secondary contacts — other lost sessions. */}
        <circle cx="106" cy="222" r="2.5" fill="#52525B" />
        <circle cx="140" cy="96" r="2" fill="#3F3F46" />
        <circle cx="246" cy="238" r="2" fill="#3F3F46" />
      </svg>

      <div className="absolute left-4 top-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-[#52525B]">
        <div>LAT: 37.7749</div>
        <div>LON: -122.4194</div>
        <div className="mt-1 text-[#3F3F46]">SCAN: AGENT VECTORS</div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-orange">
          ▲ CONTEXT VOID DETECTED
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#52525B]">
          04 FAULTS
        </span>
      </div>
    </div>
  );
}

const FAULTS = [
  {
    id: "001",
    kicker: "CONTEXT AMNESIA",
    heading: "Every session starts cold.",
    body: "Every new tab or agent session flushes previous instructions. You restate preferred languages, design rules, and project patterns over and over.",
  },
  {
    id: "002",
    kicker: "WALLED SILOS",
    heading: "Memory trapped in proprietary clouds.",
    body: "Cloud assistants lock memory into closed silos. Independent web apps cannot collaborate on shared user context without brittle custom integrations.",
  },
  {
    id: "003",
    kicker: "REDUNDANT PROMPTING",
    heading: "They meter your patience.",
    body: "Instead of creating, you spend the first three minutes of every session re-configuring a basic environment the agent already learned once.",
  },
  {
    id: "004",
    kicker: "ZERO GOVERNANCE",
    heading: "Opaque context, no human control.",
    body: "Traditional agents collect context silently: no visible audit trail, no source lineage, and no obvious way to purge what you never wanted kept.",
  },
];

export function ProblemSection() {
  return (
    <Section id="problem" className="py-20 sm:py-28">
      <SectionHeading
        tag="THE PROBLEM"
        glyph="✕"
        tone="orange"
        title={
          <>
            Agents don&apos;t have memory. And you&apos;re stuck repeating yourself.
          </>
        }
        subtitle="Context dies at the tab boundary. The user becomes the integration layer — re-typing the same four facts into every tool they touch."
      />

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <RadarHUD />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {FAULTS.map((fault) => (
            <article
              key={fault.id}
              className="corner-crosshair group rounded-xl border border-[#1F1F1F] bg-surface-1 p-6 transition-colors duration-200 hover:border-[rgba(255,62,20,0.35)]"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold tracking-[0.1em] text-accent-orange">
                  [ {fault.id} ]
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52525B]">
                  {fault.kicker}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold leading-snug tracking-[-0.02em] text-white">
                {fault.heading}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">{fault.body}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
