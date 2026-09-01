import { cn } from "@/lib/cn";

/**
 * The Tether mark.
 *
 * A geometric T drawn on a 64-unit grid with a single 10-unit stroke weight:
 * an unbroken crossbar over a stem that is cut once and resumes past the cut.
 * The cut is the tab boundary, which is the exact place context normally dies.
 *
 * Fills with `currentColor`, so the colour comes from the surrounding text
 * class and the mark inverts correctly on any ground.
 */
export function TetherMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden
      className={cn("h-5 w-5", className)}
    >
      <path d="M8 9H56V19H8V9Z M27 19H37V39H27V19Z M27 47H37V55H27V47Z" />
    </svg>
  );
}

/**
 * Primary horizontal lockup: mark plus wordmark.
 *
 * The gap is half the mark's height, which is also the minimum clearspace the
 * lockup needs on every side.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <TetherMark className="h-5 w-5 text-accent-orange" />
      <span className="font-display text-xl font-extrabold tracking-[-0.04em] text-white">
        TETHER
      </span>
    </span>
  );
}
