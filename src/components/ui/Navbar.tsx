"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

import { Logo } from "./Logo";
import { Button } from "./primitives";

const LINKS = [
  { href: "/dashboard", label: "Memory Dashboard" },
  { href: "/designlab", label: "DesignLab" },
  { href: "/devforge", label: "DevForge" },
  { href: "/protocol", label: "Protocol" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1C1C1C] bg-canvas/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Link
          href="/"
          aria-label="Tether home"
          className="transition-opacity hover:opacity-80"
        >
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                  active ? "bg-surface-2 text-white" : "text-[#A1A1AA] hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/designlab" className="hidden sm:block">
            <Button variant="primary" size="md" className="rounded-full">
              Launch Demo <span aria-hidden>↵</span>
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            className="rounded-md border border-[#2E2E2E] p-2 text-white lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-[#1C1C1C] bg-canvas px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-[#A1A1AA] hover:bg-surface-2 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
