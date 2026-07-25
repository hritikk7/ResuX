import {
  Gauge,
  Sparkles,
  ShieldCheck,
  Zap,
  Mail,
  Network,
} from "lucide-react";
import Reveal from "./Reveal";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Gauge,
    title: "Semantic Match Score",
    description:
      "Not a black box. See exactly how your resume maps to the job with a transparent 40/40/20 breakdown: keyword match, semantic similarity, experience alignment.",
    span: "lg:col-span-4",
  },
  {
    icon: Sparkles,
    title: "Zero-Shot Skill Matching",
    description:
      "No static keyword lists. AI understands that “managing client relations” matches “customer success” — across any industry, any role.",
    span: "lg:col-span-2",
  },
  {
    icon: ShieldCheck,
    title: "Hallucination-Safe Rewrites",
    description:
      "Every AI suggestion is validated against your original resume. If the model invents a skill you don't have, the rewrite is flagged and rejected — never silently shown.",
    span: "lg:col-span-2",
  },
  {
    icon: Zap,
    title: "Real-Time Streaming",
    description:
      "Your score appears in under a second. Bullet rewrites fill in progressively. If the AI path fails, you still get your complete score and skills — independent pipelines.",
    span: "lg:col-span-2",
  },
  {
    icon: Mail,
    title: "Cover Letter Generator",
    description:
      "Generate a tailored cover letter grounded in your actual experience. Same hallucination guardrail as bullet rewrites.",
    span: "lg:col-span-2",
  },
  {
    icon: Network,
    title: "Multi-Provider AI",
    description:
      "Gemini, Groq, or OpenRouter. One interface, three providers. No vendor lock-in — provider failures don't crash the system.",
    span: "lg:col-span-6",
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Built to show you the gap, not flatter you
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((feature, i) => (
            <Reveal
              key={feature.title}
              delay={(i % 3) * 100}
              className={cn("sm:col-span-1", feature.span)}
            >
              <div className="group h-full rounded-xl bg-gradient-to-b from-white/10 to-white/[0.03] p-px transition-transform duration-300 hover:-translate-y-1">
                <div className="flex h-full flex-col gap-3 rounded-[calc(0.75rem-1px)] bg-[#0c0c0f] p-6">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                    <feature.icon className="size-4 text-indigo-400" aria-hidden />
                  </div>
                  <h3 className="text-[15px] font-medium text-zinc-100">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
