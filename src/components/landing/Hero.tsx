import Link from "next/link";

import { Button } from "@/components/ui/primitives";

const TICKER_ITEMS = [
  "WEBMCP PROTOCOL",
  "CROSS-SITE RECALL",
  "ZERO REDUNDANT PROMPTING",
  "100% USER GOVERNED",
  "STRUCTURED CONTEXT",
  "NO CLOUD VENDOR LOCK-IN",
];

function Ticker() {
  // Rendered twice so the -50% marquee translation loops without a seam.
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="relative overflow-hidden border-y border-[#1C1C1C] bg-[#0A0A0A] py-3">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#52525B]"
          >
            <span className="px-6">{item}</span>
            <span aria-hidden className="text-accent-orange">
              ●
            </span>
          </span>
        ))}
      </div>
      {/* Edge fades keep the loop from visibly popping at the viewport border. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A0A0A] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0A0A] to-transparent" />
    </div>
  );
}

export function Hero() {
  return (
    <section id="overview" className="pt-6">
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-8">
        <div className="relative overflow-hidden rounded-xl bg-accent-orange-surface p-8 text-black shadow-2xl sm:p-14">
          <div aria-hidden className="hero-halftone absolute inset-0 opacity-25" />
          <div aria-hidden className="scanlines absolute inset-0 opacity-20" />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -right-4 select-none font-display text-[10rem] font-extrabold leading-none tracking-tighter text-black/[0.06] sm:text-[15rem]"
          >
            TETHER
          </span>

          <div className="relative">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-black/80">
              [ 00 / AGENT PERSISTENCE PROTOCOL ]
            </span>

            {/* Deliberate line breaks at sm+: at this type size natural wrapping
                strands single words. Below sm it wraps normally. */}
            <h1 className="mt-6 max-w-6xl font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-black sm:text-6xl md:text-[4.25rem]">
              Teach once.
              <br className="hidden sm:block" /> Tether remembers.
              <br className="hidden sm:block" /> No limits.
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-black/85 sm:text-xl">
              A shared persistence layer for the agent-native web. Participating websites expose
              WebMCP tools that save, retrieve, and update context across sessions, while humans
              control what persists.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard">
                <Button variant="onOrange" size="lg" className="w-full sm:w-auto">
                  Open Memory Dashboard
                </Button>
              </Link>
              <Link href="/designlab">
                <Button variant="onOrangeGhost" size="lg" className="w-full sm:w-auto">
                  Explore Demo Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Ticker />
    </section>
  );
}
