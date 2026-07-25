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
type StepState = "done" | "active" | "pending";

// Phase 1 checklist (docs/design.md "Loading"). These labels describe what
// the corresponding backend `status` event (backend/main.py) means, not its
// literal text — the backend sends present-continuous status strings
// ("Parsing Resume..."), this checklist shows completed steps instead.
const PHASE_1_STEPS: { label: string; match: string }[] = [
  { label: "Resume parsed", match: "Parsing Resume" },
  { label: "Job description processed", match: "Generating Embeddings" },
  { label: "Skills extracted", match: "Matching Skills" },
];

const REWRITING_BULLET_RE = /Rewriting Bullet (\d+)/;

function phase1StepStates(stepIndex: number, phase1Done: boolean): StepState[] {
  return PHASE_1_STEPS.map((_, i) => {
    if (phase1Done || i < stepIndex) return "done";
    if (i === stepIndex) return "active";
    return "pending";
  });
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [phase1StepIndex, setPhase1StepIndex] = useState(0);
  const [rewritingIndex, setRewritingIndex] = useState<number | null>(null);
  const [partial, setPartial] = useState<ResultPartial | null>(null);
  const [bullets, setBullets] = useState<BulletResult[]>([]);
  const [finalResult, setFinalResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<ErrorPayload | null>(null);

  const handleSubmit = useCallback(async (file: File, jobDescription: string) => {
    setPhase("streaming");
    setPhase1StepIndex(0);
    setRewritingIndex(null);
    setPartial(null);
    setBullets([]);
    setFinalResult(null);
    setError(null);

    await analyzeResume(file, jobDescription, {
      onStatus: (s) => {
        const stepMatch = PHASE_1_STEPS.findIndex((step) => s.startsWith(step.match));
        if (stepMatch !== -1) {
          setPhase1StepIndex((prev) => Math.max(prev, stepMatch));
        }

        const bulletMatch = s.match(REWRITING_BULLET_RE);
        if (bulletMatch) {
          setRewritingIndex(Number(bulletMatch[1]));
        }
      },
      onPartial: (p) => {
        setPhase1StepIndex(PHASE_1_STEPS.length - 1);
        setPartial(p);
      },
      onBullet: (b) => {
        setRewritingIndex(null);
        setBullets((prev) => [...prev, b]);
      },
      onFinal: (r) => {
        setRewritingIndex(null);
        setFinalResult(r);
      },
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

  const streaming = phase === "streaming";
  const phase1Done = partial != null;
  const stepStates = phase1StepStates(phase1StepIndex, phase1Done);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Resume Analyzer
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Upload a résumé and a job description to get a semantic match score, missing
          skills, and rewritten weak bullets.
        </p>
      </header>

      <UploadForm disabled={streaming} onSubmit={handleSubmit} />

      {streaming && !phase1Done && (
        <ul className="flex flex-col gap-1.5">
          {PHASE_1_STEPS.map((step, i) => (
            <li
              key={step.label}
              className="flex items-center gap-2 text-[13px] text-muted-foreground"
            >
              <span
                className={
                  stepStates[i] === "done"
                    ? "text-success"
                    : stepStates[i] === "active"
                      ? "text-primary"
                      : "text-muted-foreground/50"
                }
                aria-hidden
              >
                {stepStates[i] === "done" ? "✓" : "·"}
              </span>
              <span className={stepStates[i] === "pending" ? "text-muted-foreground/50" : ""}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      )}

      {streaming && phase1Done && rewritingIndex != null && (
        <StatusBar status={`Rewriting suggestion ${rewritingIndex}…`} />
      )}

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger">
          {error.message}
        </div>
      )}

      {score && <ScoreCard score={score} />}

      <SkillsPanel matchedSkills={matchedSkills} missingSkills={missingSkills} />

      <BulletRewrites
        bullets={displayedBullets}
        pendingIndex={streaming ? rewritingIndex : null}
      />
    </main>
  );
}
