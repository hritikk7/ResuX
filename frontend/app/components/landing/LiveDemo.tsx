"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, ShieldCheck, X } from "lucide-react";
import Reveal from "./Reveal";

const CHECKS = ["Resume parsed", "JD skills extracted", "Embeddings computed"];

const SKILLS: { name: string; matched: boolean }[] = [
  { name: "Python", matched: true },
  { name: "FastAPI", matched: true },
  { name: "Docker", matched: true },
  { name: "Terraform", matched: false },
  { name: "AWS", matched: false },
];

const REWRITE =
  "Shipped a streaming analysis pipeline in FastAPI, cutting time-to-first-result from 8s to under 1s";

const FINAL_SCORE = 76;

/**
 * Stylized simulation of the real SSE stream: checklist ticks, the score
 * counts up, skill rows land one by one, then a bullet rewrite types in.
 * Pure timers + CSS transitions — no API calls.
 */
export default function LiveDemo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [runId, setRunId] = useState(0);

  const [checksDone, setChecksDone] = useState(0);
  const [score, setScore] = useState(0);
  const [skillsShown, setSkillsShown] = useState(0);
  const [typed, setTyped] = useState("");
  const [finished, setFinished] = useState(false);

  // Start once when scrolled into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Run the timeline (re-runs when runId changes via Replay).
  useEffect(() => {
    if (!started) return;

    setChecksDone(0);
    setScore(0);
    setSkillsShown(0);
    setTyped("");
    setFinished(false);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    CHECKS.forEach((_, i) => at(250 + i * 300, () => setChecksDone(i + 1)));

    // score counts up right after the checks land
    const scoreStart = 1200;
    const scoreDuration = 700;
    const scoreSteps = 20;
    for (let i = 1; i <= scoreSteps; i++) {
      at(scoreStart + (scoreDuration / scoreSteps) * i, () =>
        setScore(Math.round((FINAL_SCORE / scoreSteps) * i))
      );
    }

    SKILLS.forEach((_, i) => at(1400 + i * 140, () => setSkillsShown(i + 1)));

    const typeStart = 2300;
    for (let i = 1; i <= REWRITE.length; i++) {
      at(typeStart + i * 18, () => setTyped(REWRITE.slice(0, i)));
    }
    at(typeStart + REWRITE.length * 18 + 300, () => setFinished(true));

    return () => timers.forEach(clearTimeout);
  }, [started, runId]);

  return (
    <section id="demo" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-6" ref={sectionRef}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            Live preview
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Watch an analysis stream in
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-500">
            This is how results arrive over Server-Sent Events — score and
            skills first, rewrites progressively after.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl bg-gradient-to-b from-white/12 to-white/[0.04] p-px">
          <div className="rounded-[calc(1rem-1px)] bg-[#0b0b0e]">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <span className="font-mono text-[11px] text-zinc-500">
                GET /analyze · text/event-stream
              </span>
              <button
                id="demo-replay"
                type="button"
                onClick={() => setRunId((n) => n + 1)}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200"
              >
                <RotateCcw className="size-3" aria-hidden />
                Replay
              </button>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div className="flex flex-col gap-5">
                {/* checklist */}
                <ul className="flex flex-col gap-2 font-mono text-xs">
                  {CHECKS.map((label, i) => (
                    <li
                      key={label}
                      className={`flex items-center gap-2 transition-opacity duration-300 ${
                        i < checksDone ? "opacity-100" : "opacity-30"
                      }`}
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded-full ${
                          i < checksDone
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/5 text-zinc-600"
                        }`}
                      >
                        <Check className="size-2.5" aria-hidden />
                      </span>
                      <span className={i < checksDone ? "text-zinc-300" : "text-zinc-600"}>
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* score */}
                <div>
                  <div className="font-mono text-5xl font-semibold tracking-tight text-zinc-50">
                    {score}
                    <span className="text-xl text-zinc-500">/100</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">Semantic Match Score</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* skills stream in */}
                <div className="flex min-h-[72px] flex-wrap content-start gap-1.5">
                  {SKILLS.slice(0, skillsShown).map((skill) => (
                    <span
                      key={skill.name}
                      className={`inline-flex h-fit animate-in fade-in slide-in-from-bottom-1 items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] duration-300 ${
                        skill.matched
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : "border-red-500/20 bg-red-500/10 text-red-300"
                      }`}
                    >
                      {skill.matched ? (
                        <Check className="size-3" aria-hidden />
                      ) : (
                        <X className="size-3" aria-hidden />
                      )}
                      {skill.name}
                    </span>
                  ))}
                </div>

                {/* typing rewrite */}
                <div className="min-h-[96px] rounded-lg border border-white/5 bg-white/[0.02] p-3.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                      Bullet rewrite
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300 transition-opacity duration-300 ${
                        finished ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <ShieldCheck className="size-3" aria-hidden />
                      Guardrail verified
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-300">
                    {typed}
                    {typed.length > 0 && !finished && (
                      <span className="ml-px inline-block h-3.5 w-1.5 animate-pulse bg-indigo-400 align-middle" aria-hidden />
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
