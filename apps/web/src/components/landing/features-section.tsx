"use client";

import { motion } from "framer-motion";
import {
  GitCompare, Code2, CheckCircle2, Minimize2,
  Share2, ImageIcon, Key, BarChart3,
} from "lucide-react";

const features = [
  {
    icon: GitCompare,
    title: "Deep JSON Diff",
    description: "Key-by-key comparison with nested object analysis, array diffing, and structural mismatch detection.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    ring: "ring-violet-400/20",
  },
  {
    icon: Code2,
    title: "Beautify & Format",
    description: "Pretty-print any JSON with configurable indentation. Instant formatting in the browser.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    ring: "ring-blue-400/20",
  },
  {
    icon: CheckCircle2,
    title: "Validate JSON",
    description: "Real-time validation with detailed error messages, key counts, and depth analysis.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    ring: "ring-emerald-400/20",
  },
  {
    icon: Minimize2,
    title: "Minify JSON",
    description: "Strip whitespace and reduce payload size. See exact byte savings instantly.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    ring: "ring-orange-400/20",
  },
  {
    icon: Share2,
    title: "Shareable URLs",
    description: "Generate permanent shareable comparison links. Share results with your team instantly.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    ring: "ring-pink-400/20",
  },
  {
    icon: ImageIcon,
    title: "Export PNG / HTML",
    description: "Download visual comparison reports as PNG images or full HTML files.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    ring: "ring-cyan-400/20",
  },
  {
    icon: Key,
    title: "REST API Access",
    description: "Full API with key authentication. Integrate JSON tooling into your CI/CD pipelines.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    ring: "ring-yellow-400/20",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description: "Track API usage, monitor credits, and view detailed request history in your dashboard.",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    ring: "ring-indigo-400/20",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 lg:py-32" id="features">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Everything you need
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            A complete JSON toolset built for speed, accuracy, and developer experience.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-6 transition-all hover:border-white/10 hover:bg-white/[0.06]"
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${feature.bg} ${feature.ring}`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
