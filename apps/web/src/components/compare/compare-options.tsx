"use client";

import { useState } from "react";
import { Clock, Lock, Eye, EyeOff } from "lucide-react";
import { useCompareStore } from "@/store/compare-store";

const TTL_PRESETS = [
  { label: "2 hours", value: 2 },
  { label: "12 hours", value: 12 },
  { label: "24 hours", value: 24 },
  { label: "7 days", value: 168 },
];

export function CompareOptions() {
  const { options, setOptions } = useCompareStore();
  const [showPw, setShowPw] = useState(false);

  const toggle = (key: "ignoreOrder" | "ignoreCasing" | "ignoreWhitespace") => {
    setOptions({ ...options, [key]: !options[key] });
  };

  const boolOpts = [
    { key: "ignoreOrder" as const, label: "Ignore Array Order" },
    { key: "ignoreCasing" as const, label: "Ignore Casing" },
    { key: "ignoreWhitespace" as const, label: "Ignore Whitespace" },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      {/* Boolean toggles */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Compare Options
        </span>
        {boolOpts.map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!!options[key]}
              onChange={() => toggle(key)}
              className="h-3.5 w-3.5 rounded accent-primary"
            />
            <span className="text-sm text-muted-foreground">{label}</span>
          </label>
        ))}
      </div>

      {/* TTL + Password row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* TTL picker */}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Discard after</span>
          <select
            value={options.ttlHours ?? 12}
            onChange={(e) => setOptions({ ...options, ttlHours: Number(e.target.value) })}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-foreground outline-none focus:border-primary/50"
          >
            {TTL_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Optional password */}
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Password</span>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={options.accessPassword ?? ""}
              onChange={(e) =>
                setOptions({ ...options, accessPassword: e.target.value || undefined })
              }
              placeholder="Optional — protects share link"
              className="w-52 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 pr-8 text-xs text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-primary/50"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
