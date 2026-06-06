"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, Code2, CheckCircle2, Minimize2 } from "lucide-react";
import { JsonEditor } from "./json-editor";
import { DiffResults } from "./diff-results";
import { CompareOptions } from "./compare-options";
import { useCompareStore } from "@/store/compare-store";
import { jsonApi, ApiRequestError } from "@/lib/api";
import type { CompareResponse } from "@jsontools/shared";

type ActiveTool = "compare" | "beautify" | "validate" | "minify";

const TOOLS = [
  { id: "compare" as const, label: "Compare", icon: GitCompare },
  { id: "beautify" as const, label: "Beautify", icon: Code2 },
  { id: "validate" as const, label: "Validate", icon: CheckCircle2 },
  { id: "minify" as const, label: "Minify", icon: Minimize2 },
];

export function CompareWorkspace() {
  const [activeTool, setActiveTool] = useState<ActiveTool>("compare");
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { json1, json2, options, setJson1, setJson2 } = useCompareStore();

  const handleCompare = async () => {
    if (!json1.trim() || !json2.trim()) {
      setError("Both JSON fields are required.");
      return;
    }

    let parsed1: unknown, parsed2: unknown;
    try {
      parsed1 = JSON.parse(json1);
      parsed2 = JSON.parse(json2);
    } catch {
      setError("One or both JSON inputs are invalid. Please check syntax.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await jsonApi.compare(parsed1, parsed2, options);
      setResult(result);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Comparison failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUtility = async (tool: "beautify" | "validate" | "minify") => {
    const raw = json1;
    if (!raw.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (tool === "beautify") {
        const data = await jsonApi.beautify(raw);
        setJson1(data.result);
      } else if (tool === "minify") {
        const data = await jsonApi.minify(raw);
        setJson1(data.result);
      } else {
        await jsonApi.validate(raw);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Operation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = () => {
    if (activeTool === "compare") handleCompare();
    else handleUtility(activeTool);
  };

  const actionLabel = {
    compare: isLoading ? "Comparing..." : "Compare JSON",
    beautify: isLoading ? "Beautifying..." : "Beautify",
    validate: isLoading ? "Validating..." : "Validate",
    minify: isLoading ? "Minifying..." : "Minify",
  }[activeTool];

  return (
    <div className="flex flex-col gap-6">
      {/* Tool selector */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id); setResult(null); setError(null); }}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTool === tool.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tool.icon className="h-4 w-4" />
            {tool.label}
          </button>
        ))}
      </div>

      {/* Editor grid */}
      <div className={`grid gap-4 ${activeTool === "compare" ? "md:grid-cols-2" : "grid-cols-1 max-w-3xl"}`}>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {activeTool === "compare" ? "JSON A (Original)" : "JSON Input"}
          </label>
          <JsonEditor
            value={json1}
            onChange={setJson1}
            placeholder='{ "key": "value" }'
          />
        </div>

        {activeTool === "compare" && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              JSON B (Modified)
            </label>
            <JsonEditor
              value={json2}
              onChange={setJson2}
              placeholder='{ "key": "updated" }'
            />
          </div>
        )}
      </div>

      {/* Options (compare only) */}
      {activeTool === "compare" && <CompareOptions />}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Action button */}
      <div>
        <button
          onClick={handleAction}
          disabled={isLoading}
          className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && activeTool === "compare" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <DiffResults result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
