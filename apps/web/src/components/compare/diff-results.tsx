"use client";

import { useState } from "react";
import type { CompareResponse, DiffEntry } from "@jsontools/shared";
import { Plus, Minus, Edit2, CheckCircle2, Share2, Columns2, FileCode2 } from "lucide-react";

interface DiffResultsProps {
  result: CompareResponse;
}

const typeConfig = {
  added: {
    icon: Plus,
    label: "Added",
    className: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",
    badge: "bg-green-500/20 text-green-700 dark:text-green-400",
  },
  removed: {
    icon: Minus,
    label: "Removed",
    className: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
    badge: "bg-red-500/20 text-red-700 dark:text-red-400",
  },
  modified: {
    icon: Edit2,
    label: "Modified",
    className: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  },
  unchanged: {
    icon: CheckCircle2,
    label: "Unchanged",
    className: "bg-muted border-border text-muted-foreground",
    badge: "bg-muted text-muted-foreground",
  },
};

export function DiffResults({ result }: DiffResultsProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "visual-studio">(
    "side-by-side"
  );
  const visibleDiffs = result.differences.filter((d) => d.type !== "unchanged");
  const shareUrl = result.shareToken
    ? `${window.location.origin}/compare/share/${result.shareToken}`
    : null;

  const copyShare = () => {
    if (shareUrl) navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "added", value: result.summary.added, color: "text-green-600" },
          { key: "removed", value: result.summary.removed, color: "text-red-600" },
          { key: "modified", value: result.summary.modified, color: "text-yellow-600" },
          { key: "unchanged", value: result.summary.unchanged, color: "text-muted-foreground" },
        ].map(({ key, value, color }) => (
          <div key={key} className="rounded-xl border bg-card p-4 text-center shadow-sm">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="mt-1 text-xs capitalize text-muted-foreground">{key}</div>
          </div>
        ))}
      </div>

      {/* Status badge + share */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
            result.summary.isEqual
              ? "bg-green-500/10 text-green-700"
              : "bg-red-500/10 text-red-700"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {result.summary.isEqual ? "JSONs are identical" : "Differences found"}
          <span className="text-xs opacity-70">· {result.processingTimeMs}ms</span>
        </div>

        {shareUrl && (
          <button
            onClick={copyShare}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            Copy Share Link
          </button>
        )}
      </div>

      {/* Compare view toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          View
        </span>
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            onClick={() => setViewMode("side-by-side")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "side-by-side"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            Side by Side
          </button>
          <button
            onClick={() => setViewMode("visual-studio")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "visual-studio"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            VS Change View
          </button>
        </div>
      </div>

      {/* Diff list */}
      {visibleDiffs.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">
            Differences ({visibleDiffs.length})
          </h3>
          {viewMode === "side-by-side" ? (
            <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
              {visibleDiffs.map((diff, i) => (
                <DiffRow key={i} diff={diff} />
              ))}
            </div>
          ) : (
            <VisualStudioDiffView diffs={visibleDiffs} />
          )}
        </div>
      )}
    </div>
  );
}

function DiffRow({ diff }: { diff: DiffEntry }) {
  const config = typeConfig[diff.type];

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${config.className}`}>
      <config.icon className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <code className="font-mono text-xs font-medium">{diff.path}</code>
        {diff.type === "modified" && (
          <div className="mt-1 flex flex-wrap gap-2 text-xs opacity-80">
            <span className="line-through">{JSON.stringify(diff.oldValue)}</span>
            <span>→</span>
            <span>{JSON.stringify(diff.newValue)}</span>
          </div>
        )}
        {diff.type === "added" && (
          <div className="mt-1 text-xs opacity-80">
            {JSON.stringify(diff.newValue)}
          </div>
        )}
        {diff.type === "removed" && (
          <div className="mt-1 text-xs opacity-80 line-through">
            {JSON.stringify(diff.oldValue)}
          </div>
        )}
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${config.badge}`}>
        {config.label}
      </span>
    </div>
  );
}

function VisualStudioDiffView({ diffs }: { diffs: DiffEntry[] }) {
  const lines = buildVsLines(diffs);

  return (
    <div className="max-h-[520px] overflow-y-auto rounded-xl border bg-card">
      <div className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        Visual Studio style change map: red = removed, green = added, yellow = modified
      </div>
      <div className="font-mono text-xs">
        {lines.map((line, idx) => (
          <div
            key={`${line.path}-${idx}`}
            className={`grid grid-cols-[48px_26px_1fr] items-start border-b last:border-b-0 ${line.rowClass}`}
          >
            <div className="select-none border-r px-2 py-1.5 text-right text-muted-foreground/80">
              {idx + 1}
            </div>
            <div className="select-none border-r px-2 py-1.5 text-center font-semibold">
              {line.marker}
            </div>
            <div className="whitespace-pre-wrap break-words px-3 py-1.5">
              <span className="opacity-70">{line.path}</span>
              {"  "}
              <span>{line.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildVsLines(diffs: DiffEntry[]): Array<{
  path: string;
  marker: "+" | "-" | "~";
  value: string;
  rowClass: string;
}> {
  const lines: Array<{
    path: string;
    marker: "+" | "-" | "~";
    value: string;
    rowClass: string;
  }> = [];

  for (const diff of diffs) {
    if (diff.type === "added") {
      lines.push({
        path: diff.path,
        marker: "+",
        value: fmt(diff.newValue),
        rowClass: "bg-green-500/10 text-green-700 dark:text-green-300",
      });
      continue;
    }

    if (diff.type === "removed") {
      lines.push({
        path: diff.path,
        marker: "-",
        value: fmt(diff.oldValue),
        rowClass: "bg-red-500/10 text-red-700 dark:text-red-300",
      });
      continue;
    }

    if (diff.type === "modified") {
      lines.push({
        path: diff.path,
        marker: "~",
        value: `${fmt(diff.oldValue)} -> ${fmt(diff.newValue)}`,
        rowClass: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
      });
    }
  }

  return lines;
}

function fmt(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
