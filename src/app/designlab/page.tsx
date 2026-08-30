import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DesignLab } from "@/components/surfaces/DesignLab";
import { TelemetryStream } from "@/components/surfaces/TelemetryStream";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import { Button, Section, SectionTag } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "DesignLab",
  description:
    "DesignLab is a participating WebMCP site that teaches Tether your design and language preferences.",
};

export default function DesignLabPage() {
  return (
    <div className="bg-grid-pattern min-h-screen">
      <Navbar />
      <main>
        <Section className="pb-10 pt-10 sm:pt-14">
          <SectionTag glyph="↗" tone="orange">
            DEMO SITE 01 · CONTEXT PRODUCER
          </SectionTag>
          <div className="mt-6">
            <DesignLab />
          </div>
          <TelemetryStream className="mt-8" />

          <div className="mt-8 flex flex-col gap-4 rounded-xl border border-[#1F1F1F] bg-surface-1 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-bold tracking-[-0.02em] text-white">
                Preferences stored? Now open a site that has never met you.
              </p>
              <p className="mt-1 text-sm text-[#A1A1AA]">
                DevForge will ask Tether what you prefer before it generates anything.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="md">
                  View memory feed
                </Button>
              </Link>
              <Link href="/devforge">
                <Button variant="primary" size="md">
                  Go to DevForge
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
