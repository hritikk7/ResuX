import { Check, ShieldCheck, X } from "lucide-react";

const BREAKDOWN = [
  { label: "Keyword match", weight: "40%", value: 82, bar: "w-[82%]" },
  { label: "Semantic similarity", weight: "40%", value: 76, bar: "w-[76%]" },
  { label: "Experience match", weight: "20%", value: 70, bar: "w-[70%]" },
];

const SKILLS: { name: string; matched: boolean }[] = [
  { name: "React", matched: true },
  { name: "TypeScript", matched: true },
  { name: "PostgreSQL", matched: true },
  { name: "Kubernetes", matched: false },
  { name: "GraphQL", matched: false },
];

/**
 * Static, stylized mock of the analysis results UI — frosted glass card with
 * the score + 40/40/20 breakdown, skill rows, and a guardrail-verified bullet
 * rewrite. Pure markup, no client JS.
 */
export default function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* glow behind the card */}
      <div
        className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-500/20 via-violet-500/10 to-transparent blur-2xl"
        aria-hidden
      />

      <div className="rounded-2xl bg-gradient-to-b from-white/15 to-white/[0.04] p-px shadow-2xl shadow-black/60">
        <div className="rounded-[calc(1rem-1px)] bg-[#0b0b0e]/90 backdrop-blur-xl">
          {/* window chrome */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-zinc-700" />
              <span className="size-2.5 rounded-full bg-zinc-700" />
              <span className="size-2.5 rounded-full bg-zinc-700" />
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              streaming · sse
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:gap-8">
            {/* score + breakdown */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-mono text-6xl font-semibold tracking-tight text-zinc-50">
                  76
                  <span className="text-2xl text-zinc-500">/100</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">Semantic Match Score</p>
              </div>

              <div className="flex w-56 flex-col gap-2.5">
                {BREAKDOWN.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-baseline justify-between text-[11px]">
                      <span className="text-zinc-400">
                        {row.label}
                        <span className="ml-1.5 text-zinc-600">{row.weight}</span>
                      </span>
                      <span className="font-mono text-zinc-300">{row.value}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5">
                      <div
                        className={`h-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 ${row.bar}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* skills + rewrite */}
            <div className="flex min-w-0 flex-col gap-4">
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Skills vs. job description
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((skill) => (
                    <span
                      key={skill.name}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] ${
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
              </div>

              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    Bullet rewrite
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                    <ShieldCheck className="size-3" aria-hidden />
                    Guardrail verified
                  </span>
                </div>
                <p className="text-xs text-zinc-600 line-through decoration-zinc-700">
                  Worked on backend services for the platform
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                  Built FastAPI services powering resume analysis for concurrent
                  users, streaming results over SSE in under a second
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
