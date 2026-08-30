"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Section, SectionHeading } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const FAQS = [
  {
    q: "What is Tether?",
    a: "Tether is a shared persistence layer for the agent-native web. It lets WebMCP-enabled websites save, retrieve, update, and delete structured user context so people stop re-prompting the same four facts into every tool they open.",
  },
  {
    q: "How does Tether use WebMCP?",
    a: "Each participating site registers page-provided tools on the browser's model context — store_context, retrieve_context, save_preference, create_project, and so on. An agent discovers those tools the way it discovers any other page capability, and calls them during ordinary user interactions.",
  },
  {
    q: "Does WebMCP carry memory automatically between sites?",
    a: "No, and it is worth being precise about this. WebMCP provides the tool interface on each page. Tether is the shared backplane those tools read from and write to. The cross-site continuity comes from the shared layer, not from the protocol itself.",
  },
  {
    q: "How does human control work?",
    a: "Open the Tether control plane at any time to inspect every stored memory: which site wrote it, through which tool, when, with what confidence. Edit or permanently delete any record. Deletion is immediate and global — no participating site can retrieve it afterwards.",
  },
  {
    q: "What happens in a browser without WebMCP?",
    a: "The product still works and says so plainly. Tools stay declared and the UI reports that no model context was found. On-page controls execute the identical tool handlers, and every resulting log line is stamped MANUAL so nothing is mistaken for agent activity.",
  },
  {
    q: "What is the stack?",
    a: "Next.js with TypeScript, Tailwind CSS, Zod for validating every tool input, and Supabase Postgres for storage — with a zero-config in-memory driver so a fresh clone runs with no environment variables at all.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" className="py-20 sm:py-24">
      <SectionHeading tag="FAQ" glyph="⊞" title="Frequently asked questions." />

      <div className="mt-10 divide-y divide-[#1C1C1C] border-y border-[#1C1C1C]">
        {FAQS.map((faq, index) => {
          const isOpen = open === index;
          return (
            <div key={faq.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 py-5 text-left transition-colors hover:text-white"
              >
                <span className="font-mono text-xs font-bold tracking-[0.1em] text-accent-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "flex-1 font-display text-base font-bold tracking-[-0.02em] sm:text-lg",
                    isOpen ? "text-white" : "text-[#D4D4D8]",
                  )}
                >
                  {faq.q}
                </span>
                <Plus
                  className={cn(
                    "h-4 w-4 shrink-0 text-[#52525B] transition-transform duration-200",
                    isOpen && "rotate-45 text-accent-orange",
                  )}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <p className="max-w-3xl animate-fade-up pb-6 pl-9 text-sm leading-relaxed text-[#A1A1AA]">
                  {faq.a}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
