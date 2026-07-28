"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { fetchAnalysis, NotFoundError } from "@/lib/analyses";
import type { AnalysisDetail } from "@/lib/types";
import ScoreCard from "@/app/components/ScoreCard";
import SkillsPanel from "@/app/components/SkillsPanel";
import BulletRewrites from "@/app/components/BulletRewrites";
import SectionCard from "@/app/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Phase = "loading" | "error" | "not-found" | "ready";

export default function AnalysisDetailPage() {
  // Next 16 makes the `params` prop a Promise; useParams reads it without
  // unwrapping, and this page is a client component anyway.
  const { id } = useParams<{ id: string }>();

  const [phase, setPhase] = useState<Phase>("loading");
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
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

    fetchAnalysis(id, controller.signal)
      .then((row) => {
        setAnalysis(row);
        setPhase("ready");
      })
      .catch((e: unknown) => {
        // The abort here is our own cleanup, not a failure worth showing.
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Could not load this analysis.");
        setPhase(e instanceof NotFoundError ? "not-found" : "error");
      });

    return () => controller.abort();
  }, [id, attempt]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <Link
        href="/dash/history"
        className="-ml-1 flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        History
      </Link>

      {phase === "loading" && (
        <div className="flex flex-col gap-8" aria-busy="true">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-10 w-24" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      )}

      {/* Retrying a 404 changes nothing, so it gets a message, not a button. */}
      {phase === "not-found" && (
        <p className="text-[13px] text-muted-foreground">{error}</p>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[13px] text-danger">{error}</p>
          <Button variant="outline" size="sm" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      {phase === "ready" && analysis && (
        <>
          <header className="flex flex-col gap-1.5">
            <h1
              className={
                analysis.resume_filename
                  ? "font-mono text-lg font-semibold tracking-tight text-foreground"
                  : "font-mono text-lg font-semibold tracking-tight text-muted-foreground"
              }
            >
              {analysis.resume_filename ?? "Untitled resume"}
            </h1>
            <time
              dateTime={analysis.created_at}
              className="text-xs text-muted-foreground"
            >
              {new Date(analysis.created_at).toLocaleString()}
            </time>
          </header>

          <ScoreCard score={analysis.score} />

          <SkillsPanel
            matchedSkills={analysis.matched_skills}
            missingSkills={analysis.missing_skills}
          />

          <BulletRewrites bullets={analysis.bullet_rewrites} />

          <SectionCard eyebrow="Job description">
            {/* Native <details>: no accordion exists in components/ui, this needs
                no state, and it is keyboard- and screen-reader-accessible as-is. */}
            <details className="group">
              <summary className="w-fit cursor-pointer list-none text-[13px] text-foreground transition-colors duration-150 hover:text-muted-foreground">
                <span className="inline-block transition-transform duration-150 group-open:rotate-90">
                  ›
                </span>{" "}
                Show
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                {analysis.job_description}
              </p>
            </details>
          </SectionCard>
        </>
      )}
    </main>
  );
}
