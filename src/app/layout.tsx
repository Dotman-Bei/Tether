import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Poppins } from "next/font/google";

import "./globals.css";

const display = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tether — Teach once. Carry forward.",
    template: "%s · Tether",
  },
  description:
    "Tether is a shared memory layer for the agent-native web. Participating websites expose WebMCP tools that save, retrieve, and update user context — while humans control what persists.",
  applicationName: "Tether",
  openGraph: {
    title: "Tether — Teach once. Carry forward.",
    description:
      "A shared memory layer for the agent-native web, built on WebMCP tools.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060606",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-canvas font-body antialiased">{children}</body>
    </html>
  );
}
