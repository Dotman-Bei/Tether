import { Section } from "@/components/ui/primitives";

const METRICS = [
  {
    label: "Tool discovery",
    value: "In-page",
    note: "Agents read tools straight off the page's model context, with no broker hop.",
  },
  {
    label: "Human control",
    value: "100%",
    note: "Every memory is inspectable and permanently deletable by the user.",
  },
  {
    label: "Re-prompting",
    value: "$0",
    note: "Context taught once is reused, not re-typed and re-tokenised per site.",
  },
  {
    label: "Scope",
    value: "Session",
    note: "Memories live in one opaque first-party session. No accounts, no PII.",
  },
];

export function MetricsHUD() {
  return (
    <Section className="pb-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#1F1F1F] lg:grid-cols-4">
        {METRICS.map((metric) => (
          <div key={metric.label} className="bg-surface-1 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#52525B]">
              {metric.label}
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-accent-orange sm:text-3xl">
              {metric.value}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#71717A]">{metric.note}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
