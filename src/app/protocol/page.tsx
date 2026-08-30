import type { Metadata } from "next";
import { KeyRound, Lock, ShieldCheck, Trash2 } from "lucide-react";

import { CodeViewer } from "@/components/landing/CodeViewer";
import { ToolCatalog } from "@/components/landing/ToolCatalog";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import { Panel, Section, SectionHeading, SectionTag } from "@/components/ui/primitives";
import { SNIPPETS } from "@/lib/snippets";

export const metadata: Metadata = {
  title: "Protocol",
  description:
    "How Tether registers WebMCP tools, what its API contract looks like, and how the privacy model is scoped.",
};

const ENDPOINTS = [
  { method: "POST", path: "/api/memory", note: "Create one structured memory. Idempotent on content." },
  { method: "GET", path: "/api/memory", note: "List every memory for the session. Optional source/category filters." },
  { method: "GET", path: "/api/memory/search?q=", note: "Ranked retrieval with per-memory match reasons." },
  { method: "GET", path: "/api/memory/:id", note: "Fetch one memory by id." },
  { method: "PATCH", path: "/api/memory/:id", note: "Refine content, category, tags, or confidence." },
  { method: "DELETE", path: "/api/memory/:id", note: "Permanent removal. The human control path." },
  { method: "GET", path: "/api/activity", note: "Server-persisted WebMCP event log, shared across tabs." },
  { method: "GET", path: "/api/health", note: "Store driver and liveness for the status pill." },
];

const METHOD_TONE: Record<string, string> = {
  GET: "text-signal-green",
  POST: "text-accent-orange",
  PATCH: "text-signal-amber",
  DELETE: "text-signal-red",
};

const PRIVACY = [
  {
    icon: <KeyRound className="h-4 w-4 text-accent-orange" aria-hidden />,
    title: "No secrets in the browser",
    body: "The Supabase service-role key is read only inside server-only modules. The client never sees a database credential; it talks to same-origin route handlers.",
  },
  {
    icon: <Lock className="h-4 w-4 text-accent-orange" aria-hidden />,
    title: "Session-scoped memories",
    body: "Each visitor gets an opaque random id in an httpOnly first-party cookie. There are no accounts and no personal data — one visitor's demo can never appear in another's feed.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4 text-accent-orange" aria-hidden />,
    title: "Every input validated",
    body: "Tool arguments and API bodies pass through Zod schemas before reaching the store: length caps, category enums, tag limits, and a bounded confidence score.",
  },
  {
    icon: <Trash2 className="h-4 w-4 text-accent-orange" aria-hidden />,
    title: "Deletion is real",
    body: "DELETE removes the row. There is no archive table and no soft-delete flag. Once removed, retrieve_context cannot return it to any site.",
  },
];

export default function ProtocolPage() {
  return (
    <div className="bg-grid-pattern min-h-screen">
      <Navbar />
      <main>
        <Section className="pt-10 sm:pt-14">
          <SectionTag glyph="⎔" tone="orange">
            WEBMCP TECHNICAL ARCHITECTURE
          </SectionTag>
          <h1 className="mt-6 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl">
            Nine tools, one contract, zero hidden state.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#A1A1AA]">
            Tether exposes four memory tools of its own. Each participating site adds tools that do
            something real in that product and route through the same shared layer.
          </p>
        </Section>

        <Section className="py-16">
          <SectionHeading
            tag="TOOL CATALOG"
            glyph="⌗"
            title="Every tool registered across the three surfaces."
            subtitle="Constrained input schemas, predictable structured output, and a genuine product purpose behind each one."
          />
          <div className="mt-8">
            <ToolCatalog />
          </div>
        </Section>

        <Section className="pb-16">
          <SectionHeading
            tag="REGISTRATION"
            glyph="↗"
            title="How a page hands an agent a real capability."
            subtitle="Excerpts from the files that ship in this repository."
          />
          <CodeViewer snippets={SNIPPETS} className="mt-8" />

          <Panel className="mt-5 p-5">
            <p className="text-sm leading-relaxed text-[#A1A1AA]">
              The adapter probes{" "}
              <code className="font-mono text-accent-orange">navigator.modelContext</code>,{" "}
              <code className="font-mono text-accent-orange">window.modelContext</code>, and{" "}
              <code className="font-mono text-accent-orange">document.modelContext</code>, and
              supports both the imperative{" "}
              <code className="font-mono text-white">registerTool()</code> and declarative{" "}
              <code className="font-mono text-white">provideContext()</code> shapes, because
              different WebMCP builds expose different ones. When none is present, the UI reports
              that plainly rather than simulating an agent.
            </p>
          </Panel>
        </Section>

        <Section className="pb-16">
          <SectionHeading tag="API CONTRACT" glyph="⇄" title="The shared backplane." />
          <Panel className="mt-8 divide-y divide-[#1F1F1F] overflow-hidden">
            {ENDPOINTS.map((endpoint) => (
              <div
                key={`${endpoint.method}-${endpoint.path}`}
                className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span
                  className={`w-16 shrink-0 font-mono text-xs font-bold ${METHOD_TONE[endpoint.method]}`}
                >
                  {endpoint.method}
                </span>
                <code className="shrink-0 font-mono text-sm text-white">{endpoint.path}</code>
                <span className="text-xs text-[#71717A] sm:ml-auto sm:text-right">
                  {endpoint.note}
                </span>
              </div>
            ))}
          </Panel>
        </Section>

        <Section id="privacy" className="pb-20">
          <SectionHeading
            tag="PRIVACY MODEL"
            glyph="⊘"
            title="An MVP architecture, described honestly."
            subtitle="This is a hackathon demo, not a production data platform. Here is exactly what it does and does not do."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PRIVACY.map((item) => (
              <Panel key={item.title} className="p-5">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg border border-[#2E2E2E] bg-surface-2 p-1.5">
                    {item.icon}
                  </span>
                  <h3 className="font-display text-base font-bold tracking-[-0.02em] text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">{item.body}</p>
              </Panel>
            ))}
          </div>

          <Panel className="mt-4 p-5">
            <p className="text-sm leading-relaxed text-[#A1A1AA]">
              <span className="font-semibold text-white">What this is not:</span> Tether does not
              claim production-grade privacy or security. There is no authentication, no encryption
              at rest beyond what the database provides, and no multi-user isolation past the
              session cookie. Do not store sensitive personal data in it.
            </p>
          </Panel>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
