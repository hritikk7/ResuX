"use client";

import { useCallback, useState } from "react";
import { analyzeResume } from "@/lib/analyze";
import type { AnalysisResult, BulletResult, ErrorPayload, ResultPartial } from "@/lib/types";
import UploadForm from "@/app/components/UploadForm";
import StatusBar from "@/app/components/StatusBar";
import ScoreCard from "@/app/components/ScoreCard";
import SkillsPanel from "@/app/components/SkillsPanel";
import BulletRewrites from "@/app/components/BulletRewrites";

type Phase = "idle" | "streaming" | "done";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [partial, setPartial] = useState<ResultPartial | null>(null);
  const [bullets, setBullets] = useState<BulletResult[]>([]);
  const [finalResult, setFinalResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<ErrorPayload | null>(null);

  const handleSubmit = useCallback(async (file: File, jobDescription: string) => {
    setPhase("streaming");
    setStatus(null);
    setPartial(null);
    setBullets([]);
    setFinalResult(null);
    setError(null);

    await analyzeResume(file, jobDescription, {
      onStatus: (s) => setStatus(s),
      onPartial: (p) => setPartial(p),
      onBullet: (b) => setBullets((prev) => [...prev, b]),
      onFinal: (r) => setFinalResult(r),
      onError: (e) => {
        // A failure in the LLM/bullet leg shouldn't erase a score that already
        // rendered (PRD: score path is independent of the LLM path).
        setError(e);
      },
    });

    setPhase("done");
  }, []);

  const score = finalResult?.score ?? partial?.score;
  const matchedSkills = finalResult?.matched_skills ?? partial?.matched_skills ?? [];
  const missingSkills = finalResult?.missing_skills ?? partial?.missing_skills ?? [];
  const displayedBullets = finalResult?.bullet_rewrites ?? bullets;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Resume Analyzer
        </h1>
        <p className="text-sm text-muted">
          Upload a résumé and a job description to get a semantic match score, missing
          skills, and rewritten weak bullets.
        </p>
      </header>

      <UploadForm disabled={phase === "streaming"} onSubmit={handleSubmit} />

      {phase === "streaming" && status && <StatusBar status={status} />}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500">
          {error.message}
        </div>
      )}

      {score && <ScoreCard score={score} />}

      <SkillsPanel matchedSkills={matchedSkills} missingSkills={missingSkills} />

      <BulletRewrites bullets={displayedBullets} />
    </main>
  );
}
