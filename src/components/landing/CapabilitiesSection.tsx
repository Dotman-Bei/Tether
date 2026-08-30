import { Section, SectionHeading } from "@/components/ui/primitives";

const CAPABILITIES = [
  {
    id: "01",
    title: "Multi-site interoperability",
    body: "Context written by one participating WebMCP site is readable by the next through a single shared contract — no bespoke integration per pair of sites.",
  },
  {
    id: "02",
    title: "WebMCP native protocol",
    body: "Tools are registered on the page's own model context. Agents discover real site capabilities instead of scraping a DOM that was never meant for them.",
  },
  {
    id: "03",
    title: "Full human sovereignty",
    body: "Every memory shows its source, the tool that wrote it, and when. One click deletes it everywhere, permanently, with no shadow copy left behind.",
  },
  {
    id: "04",
    title: "Structured semantic storage",
    body: "Category, tags, and a confidence score — not an undifferentiated text dump. Structure is what makes retrieval explainable rather than magical.",
  },
  {
    id: "05",
    title: "Sandboxed privacy model",
    body: "Memories are scoped to one browser session via an opaque first-party cookie. No accounts, no PII, no third-party telemetry.",
  },
  {
    id: "06",
    title: "In-page tool execution",
    body: "Tools run in the browser against a same-origin API. There is no extension to install and no external agent broker in the path.",
  },
];

export function CapabilitiesSection() {
  return (
    <Section id="capabilities" className="py-20 sm:py-24">
      <SectionHeading
        tag="CAPABILITIES"
        glyph="⎔"
        tone="orange"
        title="What the memory layer actually guarantees."
        subtitle="Six properties that separate a shared context layer from an assistant's private chat history."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((capability) => (
          <article
            key={capability.id}
            className="group rounded-xl border border-[#1F1F1F] bg-surface-1 p-6 transition-colors duration-200 hover:border-[rgba(255,62,20,0.45)]"
          >
            <span className="font-mono text-xs font-bold tracking-[0.1em] text-accent-orange">
              [ {capability.id} ]
            </span>
            <h3 className="mt-4 font-display text-lg font-bold leading-snug tracking-[-0.02em] text-white">
              {capability.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">{capability.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
