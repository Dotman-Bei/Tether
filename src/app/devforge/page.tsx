import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DevForge } from "@/components/surfaces/DevForge";
import { TelemetryStream } from "@/components/surfaces/TelemetryStream";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import { Button, Section, SectionTag } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "DevForge",
  description:
    "DevForge is a participating WebMCP site that retrieves your Tether memories and configures a starter project from them.",
};

export default function DevForgePage() {
  return (
    <div className="bg-grid-pattern min-h-screen">
      <Navbar />
      <main>
        <Section className="pb-10 pt-10 sm:pt-14">
          <SectionTag glyph="↙" tone="orange">
            DEMO SITE 02 · CONTEXT CONSUMER
          </SectionTag>
          <div className="mt-6">
            <DevForge />
          </div>
          <TelemetryStream className="mt-8" />

          <div className="mt-8 flex flex-col gap-4 rounded-xl border border-[#1F1F1F] bg-surface-1 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-bold tracking-[-0.02em] text-white">
                The agent remembered. You decide what it keeps.
              </p>
              <p className="mt-1 text-sm text-[#A1A1AA]">
                Open the control plane and delete a memory — then scaffold again and watch that
                setting fall back to a default.
              </p>
            </div>
            <Link href="/dashboard" className="shrink-0">
              <Button variant="primary" size="md">
                Open control plane
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
