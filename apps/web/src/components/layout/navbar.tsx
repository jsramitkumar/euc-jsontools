"use client";

import Link from "next/link";
import { Braces, ArrowRight } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
            <Braces className="h-4 w-4 text-primary" />
          </div>
          <span className="text-foreground">JSONTools</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {[
            { href: "/compare", label: "Compare" },
            { href: "#features", label: "Features" },
            { href: "#pricing", label: "Pricing" },
            { href: "/documentation", label: "API Docs" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40"
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
