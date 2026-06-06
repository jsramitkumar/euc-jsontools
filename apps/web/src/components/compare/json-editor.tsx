"use client";

import dynamic from "next/dynamic";

// Monaco editor must be loaded client-side only
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false, loading: () => <div className="h-72 rounded-lg bg-muted animate-pulse" /> }
);

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function JsonEditor({ value, onChange, readOnly = false }: JsonEditorProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <MonacoEditor
        height="320px"
        language="json"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          formatOnPaste: true,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
