import type { Metadata } from "next";

import { TelemetryStream } from "@/components/surfaces/TelemetryStream";
import { TetherControlPlane } from "@/components/surfaces/TetherControlPlane";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import { Section, SectionTag } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Memory Dashboard",
  description:
    "Inspect, search, and permanently delete every memory participating sites have stored in your Tether layer.",
};

export default function DashboardPage() {
  return (
    <div className="bg-grid-pattern min-h-screen">
      <Navbar />
      <main>
        <Section className="pb-10 pt-10 sm:pt-14">
          <SectionTag glyph="◆" tone="orange">
            TETHER CONTROL PLANE
          </SectionTag>
          <div className="mt-6">
            <TetherControlPlane />
          </div>
          <TelemetryStream className="mt-8" />
        </Section>
      </main>
      <Footer />
    </div>
  );
}
