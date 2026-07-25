import { FileUp, Activity, Target } from "lucide-react";
import Reveal from "./Reveal";

const STEPS = [
  {
    icon: FileUp,
    title: "Upload & paste",
    description:
      "Drop in your resume (PDF or text) and paste the job description you're targeting.",
  },
  {
    icon: Activity,
    title: "AI analyzes in real-time",
    description:
      "Zero-shot skill matching, semantic scoring, and bullet review run in parallel and stream as they finish.",
  },
  {
    icon: Target,
    title: "Get your gap analysis",
    description:
      "A transparent score, the exact skills you're missing, and rewritten bullets for your weakest lines.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            From upload to gap analysis in seconds
          </h2>
        </Reveal>

        <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {/* connecting line between steps */}
          <div
            className="absolute left-[16.6%] right-[16.6%] top-6 hidden border-t border-dashed border-white/10 sm:block"
            aria-hidden
          />

          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 120} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-[#0c0c0f] shadow-[0_0_24px_-8px_rgba(99,102,241,0.5)]">
                <step.icon className="size-5 text-indigo-400" aria-hidden />
              </div>
              <span className="mt-4 font-mono text-[11px] text-zinc-600">
                0{i + 1}
              </span>
              <h3 className="mt-1 text-base font-medium text-zinc-100">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
                {step.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
