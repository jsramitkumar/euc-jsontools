"use client";

import Link from "next/link";
import { Braces } from "lucide-react";

const links = {
  Product: [
    { label: "Compare", href: "/compare" },
    { label: "Beautify", href: "/compare" },
    { label: "Validate", href: "/compare" },
    { label: "Minify", href: "/compare" },
  ],
  Developers: [
    { label: "API Docs", href: "/documentation" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
                <Braces className="h-3.5 w-3.5 text-primary" />
              </div>
              JSONTools
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Enterprise-grade JSON tooling for developers and teams.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {title}
              </p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} JSONTools. All rights reserved.</p>
          <p>Built for developers.</p>
        </div>
      </div>
    </footer>
  );
}
