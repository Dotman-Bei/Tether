import Link from "next/link";

import { DEVPOST_URL, REPO_URL } from "@/lib/constants";

import { Button, StatusPill } from "./primitives";

/** 3D perspective wireframe horizon, drawn as pure SVG (no image payload). */
function HorizonMesh() {
  const verticals = Array.from({ length: 21 }, (_, i) => i);
  const horizontals = Array.from({ length: 9 }, (_, i) => i);

  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 260"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px] w-full"
    >
      <defs>
        <linearGradient id="horizon-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF3E14" stopOpacity="0" />
          <stop offset="45%" stopColor="#FF3E14" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#FF3E14" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="horizon-glow" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="#FF3E14" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FF3E14" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="260" fill="url(#horizon-glow)" />

      {/* Vertical rails converging on the vanishing point at (600, 0). */}
      {verticals.map((index) => {
        const x = (index / 20) * 2400 - 600;
        return (
          <line
            key={`v-${index}`}
            x1="600"
            y1="0"
            x2={x}
            y2="260"
            stroke="url(#horizon-fade)"
            strokeWidth="1"
          />
        );
      })}

      {/* Horizontals spaced by a power curve so they bunch toward the horizon. */}
      {horizontals.map((index) => {
        const y = 260 * Math.pow((index + 1) / 9, 2.1);
        return (
          <line
            key={`h-${index}`}
            x1="0"
            y1={y}
            x2="1200"
            y2={y}
            stroke="#FF3E14"
            strokeOpacity={0.1 + (index / 9) * 0.5}
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

const COLUMNS = [
  {
    title: "TETHER PROTOCOL",
    links: [
      { label: "Overview", href: "/" },
      { label: "Memory Dashboard", href: "/dashboard" },
      { label: "DesignLab", href: "/designlab" },
      { label: "DevForge", href: "/devforge" },
      { label: "Architecture", href: "/protocol" },
    ],
  },
  {
    title: "CONNECT",
    links: [
      { label: "GitHub", href: REPO_URL, external: true },
      { label: "Devpost", href: DEVPOST_URL, external: true },
      { label: "WebMCP Rules", href: "https://webmcp.devpost.com/rules", external: true },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "MIT License", href: `${REPO_URL}/blob/main/LICENSE`, external: true },
      { label: "Privacy model", href: "/protocol#privacy" },
      { label: "Human control", href: "/dashboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-[#1C1C1C] bg-canvas">
      <HorizonMesh />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-20 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-5xl">
            Break free from agent amnesia.
          </h2>
          <p className="mt-4 text-lg text-[#A1A1AA]">
            Teach once. Tether remembers. Carry forward.
          </p>
          <Link href="/designlab" className="mt-7 inline-block">
            <Button variant="primary" size="lg" className="rounded-full">
              Launch Tether Protocol <span aria-hidden>↵</span>
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-10 border-t border-[#1C1C1C] pt-10 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#52525B]">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm text-[#A1A1AA] transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-[#A1A1AA] transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#1C1C1C] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <StatusPill tone="green">ALL SYSTEMS OPERATIONAL / WEBMCP v1.0</StatusPill>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#52525B]">
            © 2026 Tether · MIT Licensed · Built for the WebMCP Challenge
          </p>
        </div>
      </div>
    </footer>
  );
}
