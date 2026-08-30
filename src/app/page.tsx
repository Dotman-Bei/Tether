import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { CapabilitiesSection } from "@/components/landing/CapabilitiesSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Hero } from "@/components/landing/Hero";
import { MetricsHUD } from "@/components/landing/MetricsHUD";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";

export default function HomePage() {
  return (
    <div className="bg-grid-pattern min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <ArchitectureSection />
        <MetricsHUD />
        <CapabilitiesSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
