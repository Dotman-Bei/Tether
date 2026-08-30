import * as React from "react";

import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Bracketed section tag: [ ✕ THE PROBLEM ]                            */
/* ------------------------------------------------------------------ */

export function SectionTag({
  glyph,
  children,
  tone = "neutral",
  className,
}: {
  glyph?: string;
  children: React.ReactNode;
  tone?: "neutral" | "orange" | "green";
  className?: string;
}) {
  const tones = {
    neutral: "border-[#2E2E2E] text-[#A1A1AA]",
    orange: "border-[rgba(255,62,20,0.35)] bg-[rgba(255,62,20,0.08)] text-accent-orange",
    green: "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.08)] text-signal-green",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      <span aria-hidden className="opacity-60">
        [
      </span>
      {glyph ? <span aria-hidden>{glyph}</span> : null}
      {children}
      <span aria-hidden className="opacity-60">
        ]
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "onOrange" | "onOrangeGhost";
  size?: "sm" | "md" | "lg";
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-accent-orange text-black font-bold hover:bg-accent-orange-hover shadow-[0_0_24px_rgba(255,62,20,0.18)]",
  ghost: "text-[#A1A1AA] hover:text-white hover:bg-[#141414]",
  outline: "border border-[#2E2E2E] text-white hover:border-[#444444] hover:bg-[#141414]",
  danger:
    "border border-[rgba(239,68,68,0.4)] text-signal-red hover:bg-[rgba(239,68,68,0.1)] hover:border-signal-red",
  onOrange: "bg-black text-white font-bold hover:bg-neutral-900 shadow-lg",
  onOrangeGhost: "border-2 border-black text-black font-bold hover:bg-black/10",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-7 py-3.5 text-sm rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "outline", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
        "disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ */
/* Status pill with a live dot                                         */
/* ------------------------------------------------------------------ */

export function StatusPill({
  tone = "green",
  children,
  pulse = true,
  className,
}: {
  tone?: "green" | "amber" | "red" | "muted";
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}) {
  const tones = {
    green: "bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)] text-signal-green",
    amber: "bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)] text-signal-amber",
    red: "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-signal-red",
    muted: "bg-[#141414] border-[#2E2E2E] text-[#52525B]",
  } as const;

  const dots = {
    green: "bg-signal-green",
    amber: "bg-signal-amber",
    red: "bg-signal-red",
    muted: "bg-[#52525B]",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse ? (
          <span
            className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", dots[tone], "animate-ping")}
          />
        ) : null}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dots[tone])} />
      </span>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Panel + section scaffolding                                         */
/* ------------------------------------------------------------------ */

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-[#1F1F1F] bg-surface-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-7xl px-4 sm:px-8", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  tag,
  glyph,
  tone,
  title,
  subtitle,
  className,
}: {
  tag: string;
  glyph?: string;
  tone?: "neutral" | "orange" | "green";
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <SectionTag glyph={glyph} tone={tone}>
        {tag}
      </SectionTag>
      <h2 className="mt-5 font-display text-3xl font-bold leading-[1.15] tracking-[-0.03em] text-white sm:text-[2.5rem]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-[#A1A1AA] sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Equalizer data-stream bars                                          */
/* ------------------------------------------------------------------ */

export function EqualizerBars({
  count = 28,
  className,
  animate = true,
}: {
  count?: number;
  className?: string;
  animate?: boolean;
}) {
  // Deterministic heights: no hydration mismatch, still reads as a data stream.
  const heights = React.useMemo(
    () => Array.from({ length: count }, (_, i) => 25 + ((i * 37) % 76)),
    [count],
  );

  return (
    <div aria-hidden className={cn("flex h-8 items-end gap-1", className)}>
      {heights.map((height, index) => (
        <span
          key={index}
          className={cn(
            "w-[3px] shrink-0 origin-bottom rounded-full bg-accent-orange/70",
            animate && "animate-eq",
          )}
          style={{
            height: `${height}%`,
            animationDelay: `${(index % 9) * 110}ms`,
          }}
        />
      ))}
    </div>
  );
}
