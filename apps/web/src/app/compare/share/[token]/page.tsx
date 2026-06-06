"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Braces, ArrowLeft, Loader2, Lock, Clock, Eye, EyeOff } from "lucide-react";
import { ApiRequestError } from "@/lib/api";
import { DiffResults } from "@/components/compare/diff-results";
import { JsonEditor } from "@/components/compare/json-editor";
import type { CompareResponse } from "@jsontools/shared";

type SharedData = {
  id: string;
  json1: unknown;
  json2: unknown;
  result: CompareResponse;
  expiresAt: string;
  isProtected: boolean;
  createdAt: string;
};

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "locked"; id: string; expiresAt: string; createdAt: string }
  | { status: "ready"; data: SharedData };

async function fetchShared(token: string): Promise<SharedData> {
  const res = await fetch(`/api/v1/comparison/share/${token}`);
  const json = await res.json();
  if (res.status === 423) throw new ApiRequestError("PASSWORD_REQUIRED", "PASSWORD_REQUIRED", 423);
  if (!res.ok || !json.success) {
    throw new ApiRequestError(
      json.error?.code ?? "UNKNOWN",
      json.error?.message ?? "Failed to load",
      res.status
    );
  }
  return json.data;
}

async function unlockShared(token: string, password: string): Promise<SharedData> {
  const res = await fetch(`/api/v1/comparison/share/${token}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new ApiRequestError(
      json.error?.code ?? "UNKNOWN",
      json.error?.message ?? "Failed to unlock",
      res.status
    );
  }
  return json.data;
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

export default function SharedComparisonPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchShared(token)
      .then((data) => setState({ status: "ready", data }))
      .catch((err: ApiRequestError) => {
        if (err.code === "PASSWORD_REQUIRED") {
          // re-fetch to get metadata
          fetch(`/api/v1/comparison/share/${token}`)
            .then((r) => r.json())
            .then((j) =>
              setState({
                status: "locked",
                id: j.data?.id ?? "",
                expiresAt: j.data?.expiresAt ?? "",
                createdAt: j.data?.createdAt ?? "",
              })
            )
            .catch(() =>
              setState({ status: "locked", id: "", expiresAt: "", createdAt: "" })
            );
        } else {
          setState({
            status: "error",
            message: err.message,
            code: err.code,
          });
        }
      });
  }, [token]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setUnlockError(null);
    setUnlocking(true);
    try {
      const data = await unlockShared(token, password);
      setState({ status: "ready", data });
    } catch (err) {
      setUnlockError(err instanceof ApiRequestError ? err.message : "Unlock failed");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
              <Braces className="h-4 w-4 text-primary" />
            </div>
            JSONTools
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            New Comparison
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {state.status === "loading" && (
            <div key="loading" className="flex items-center justify-center py-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Error (404 / 410 expired / etc.) */}
          {state.status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-6 py-32 text-center"
            >
              {state.code === "EXPIRED" ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20">
                    <Clock className="h-7 w-7 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Comparison Expired</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This comparison has exceeded its retention period and has been permanently deleted.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold">Not Found</h2>
                  <p className="text-sm text-muted-foreground">{state.message}</p>
                </>
              )}
              <Link href="/compare" className="text-sm text-primary hover:underline">
                Start a new comparison →
              </Link>
            </motion.div>
          )}

          {/* Password locked */}
          {state.status === "locked" && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-8 shadow-2xl shadow-black/30">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Protected Comparison</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter the password to view this comparison.
                  </p>
                  {state.expiresAt && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {timeLeft(state.expiresAt)}
                    </p>
                  )}

                  <form onSubmit={handleUnlock} className="mt-6 space-y-4">
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {unlockError && (
                      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {unlockError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={unlocking}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-60"
                    >
                      {unlocking && <Loader2 className="h-4 w-4 animate-spin" />}
                      Unlock Comparison
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* Ready */}
          {state.status === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              {/* Meta bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Shared comparison · {new Date(state.data.createdAt).toLocaleString()}
                  </p>
                  <h1 className="mt-0.5 text-2xl font-bold">Comparison Result</h1>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-orange-400" />
                  {timeLeft(state.data.expiresAt)}
                  {state.data.isProtected && (
                    <span className="ml-2 flex items-center gap-1 text-primary">
                      <Lock className="h-3 w-3" /> Protected
                    </span>
                  )}
                </div>
              </div>

              {/* JSON panels */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    JSON A (Original)
                  </label>
                  <JsonEditor
                    value={JSON.stringify(state.data.json1, null, 2)}
                    onChange={() => {}}
                    readOnly
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    JSON B (Modified)
                  </label>
                  <JsonEditor
                    value={JSON.stringify(state.data.json2, null, 2)}
                    onChange={() => {}}
                    readOnly
                  />
                </div>
              </div>

              {/* Diff results */}
              <DiffResults result={state.data.result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
