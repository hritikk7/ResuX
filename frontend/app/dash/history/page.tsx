"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchAnalyses } from "@/lib/analyses";
import type { AnalysisHistoryItem } from "@/lib/types";
import HistoryList from "@/app/components/HistoryList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Phase = "loading" | "error" | "ready";

export default function HistoryPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<AnalysisHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Bumping this re-runs the effect; Retry doesn't need its own fetch path.
  const [attempt, setAttempt] = useState(0);

  // The reset lives here rather than in the effect body: setting state
  // synchronously inside an effect triggers a cascading render.
  const retry = useCallback(() => {
    setPhase("loading");
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchAnalyses(controller.signal)
      .then((rows) => {
        setItems(rows);
        setPhase("ready");
      })
      .catch((e: unknown) => {
        // The abort here is our own cleanup, not a failure worth showing.
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Could not load your history.");
        setPhase("error");
      });

    return () => controller.abort();
  }, [attempt]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">History</h1>
        <p className="text-[13px] text-muted-foreground">
          Your past analyses, newest first.
        </p>
      </header>

      <section className="flex flex-col gap-3 border-t border-border pt-8">
        {phase === "loading" && (
          <div className="flex flex-col gap-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[13px] text-danger">{error}</p>
            <Button variant="outline" size="sm" onClick={retry}>
              Retry
            </Button>
          </div>
        )}

        {phase === "ready" && items.length === 0 && (
          <div className="flex flex-col items-start gap-2">
            <p className="text-[13px] text-muted-foreground">No analyses yet.</p>
            <Link
              href="/dash"
              className="text-[13px] text-primary transition-colors duration-150 hover:underline"
            >
              Run your first analysis
            </Link>
          </div>
        )}

        {phase === "ready" && items.length > 0 && <HistoryList items={items} />}
      </section>
    </main>
  );
}
