"use client";

import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

const packages = [
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    price: "₹5",
    sub: "one-time",
    description: "Perfect for trying out the platform.",
    features: ["10 API calls", "JSON Compare", "Beautify & Validate", "Community support"],
  },
  {
    id: "basic",
    name: "Basic",
    credits: 100,
    price: "₹50",
    sub: "one-time",
    description: "For individual developers.",
    features: ["100 API calls", "All Starter features", "Shareable URLs", "HTML reports"],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 1000,
    price: "₹500",
    sub: "one-time",
    isPopular: true,
    description: "For teams and power users.",
    features: [
      "1,000 API calls",
      "All Basic features",
      "PNG export",
      "API key access",
      "Usage analytics",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: "Custom",
    price: "₹4",
    sub: "per 10 calls",
    description: "Unlimited scale, custom SLA.",
    features: [
      "Unlimited scale",
      "All Pro features",
      "Custom rate limits",
      "SLA guarantee",
      "Dedicated support",
    ],
  },
];

export function PricingSection() {
  return (
    <section className="py-24 lg:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Simple, prepaid pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Buy credits once, use anytime. No subscriptions. No surprises.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                pkg.isPopular
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30 shadow-xl shadow-primary/10"
                  : "border-white/5 bg-white/[0.03] hover:border-white/10"
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-primary/30">
                    <Zap className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className="text-sm font-medium text-muted-foreground">{pkg.name}</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{pkg.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">/ {pkg.sub}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{pkg.description}</p>
              </div>

              <ul className="flex-1 space-y-2.5">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  pkg.isPopular
                    ? "bg-primary text-white shadow-md shadow-primary/30 hover:bg-primary/90"
                    : "border border-white/10 text-foreground hover:bg-white/5"
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include <span className="text-foreground font-medium">10 free credits</span> on signup. No credit card required.
        </p>
      </div>
    </section>
  );
}
