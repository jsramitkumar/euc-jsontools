"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const DIFF_PREVIEW = [
  { type: "unchanged", line: '{' },
  { type: "unchanged", line: '  "name": "Alice",' },
  { type: "removed",   line: '  "age": 30,' },
  { type: "added",     line: '  "age": 31,' },
  { type: "removed",   line: '  "city": "Mumbai",' },
  { type: "added",     line: '  "city": "Pune",' },
  { type: "added",     line: '  "email": "alice@example.com",' },
  { type: "unchanged", line: '}' },
];

const lineStyle: Record<string, string> = {
  added:     "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500",
  removed:   "bg-red-500/10 text-red-400 border-l-2 border-red-500 line-through opacity-60",
  unchanged: "text-slate-400",
};

const linePrefix: Record<string, string> = {
  added: "+", removed: "-", unchanged: " ",
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute right-1/4 top-20 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Enterprise-grade JSON tooling
            </div>

            <h1 className="text-5xl font-extrabold leading-tight tracking-tight lg:text-6xl xl:text-7xl">
              Compare JSON
              <br />
              <span className="gradient-text">intelligently.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Deep nested diff, array comparison, visual highlighting, shareable
              reports, and a full REST API — everything your team needs.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/50 hover:-translate-y-0.5"
              >
                Start Comparing Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/documentation"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-white/10"
              >
                View API Docs
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex flex-wrap gap-8 text-center">
              {[
                { label: "API Calls / Day", value: "100k+" },
                { label: "Avg Response", value: "< 50ms" },
                { label: "Uptime", value: "99.9%" },
              ].map((s) => (
                <div key={s.label} className="text-left">
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — diff preview */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="hidden lg:block"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl shadow-black/40 glow">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">comparison.json</span>
              </div>
              {/* Diff lines */}
              <div className="p-4 font-mono text-sm space-y-0.5">
                {DIFF_PREVIEW.map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className={`flex gap-3 rounded px-3 py-0.5 ${lineStyle[row.type]}`}
                  >
                    <span className="w-3 shrink-0 select-none opacity-60">
                      {linePrefix[row.type]}
                    </span>
                    <span>{row.line}</span>
                  </motion.div>
                ))}
              </div>
              {/* Summary footer */}
              <div className="flex gap-4 border-t border-white/5 px-4 py-3 text-xs">
                <span className="text-emerald-400">+2 added</span>
                <span className="text-red-400">-2 removed</span>
                <span className="ml-auto text-muted-foreground">12ms</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
