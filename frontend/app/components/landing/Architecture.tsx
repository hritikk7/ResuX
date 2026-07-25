import { GitBranch, Layers, Radio } from "lucide-react";
import Reveal from "./Reveal";
import { cn } from "@/lib/utils";

function Node({
  label,
  sublabel,
  accent = false,
  className,
}: {
  label: string;
  sublabel?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-2.5 text-center font-mono text-xs",
        accent
          ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
          : "border-white/10 bg-white/[0.03] text-zinc-300",
        className
      )}
    >
      <div>{label}</div>
      {sublabel && <div className="mt-0.5 text-[10px] text-zinc-600">{sublabel}</div>}
    </div>
  );
}

function Connector() {
  return <div className="h-5 w-px bg-white/15" aria-hidden />;
}

const DECISIONS = [
  {
    icon: GitBranch,
    title: "Independent paths",
    description:
      "Score and LLM pipelines run separately. If bullet rewrites fail, your score and skills still arrive intact.",
  },
  {
    icon: Radio,
    title: "Streaming partials",
    description:
      "Each node emits its result the moment it finishes — the aggregator streams partial results over SSE instead of waiting for the slowest step.",
  },
  {
    icon: Layers,
    title: "Provider abstraction",
    description:
      "Gemini, Groq, and OpenRouter sit behind one interface with Pydantic-validated outputs. Swapping providers is a config change.",
  },
];

export default function Architecture() {
  return (
    <section id="architecture" className="scroll-mt-20 border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            Under the hood
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            A DAG that streams as it computes
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-500">
            Analysis runs as a directed graph of independent nodes. Fast paths
            never wait on slow ones.
          </p>
        </Reveal>

        {/* DAG diagram */}
        <Reveal className="mt-14 overflow-x-auto">
          <div className="mx-auto flex w-max min-w-full flex-col items-center px-2">
            <Node label="Parser" sublabel="PDF / text → structured resume" />
            <Connector />
            <Node label="Orchestrator" sublabel="fans out analysis nodes" />
            <Connector />

            {/* fan-out */}
            <div className="relative flex items-start gap-3 pt-5 sm:gap-4">
              <div
                className="absolute left-[12%] right-[12%] top-0 border-t border-white/15"
                aria-hidden
              />
              {[
                { label: "Similarity", sublabel: "Voyage embeddings" },
                { label: "Skills", sublabel: "zero-shot LLM" },
                { label: "Experience", sublabel: "seniority heuristic" },
                { label: "Weak Bullets", sublabel: "LLM + guardrail" },
              ].map((node) => (
                <div key={node.label} className="flex flex-col items-center">
                  <div className="-mt-5 h-5 w-px bg-white/15" aria-hidden />
                  <Node label={node.label} sublabel={node.sublabel} />
                </div>
              ))}
            </div>

            <Connector />
            <Node label="Aggregator" sublabel="merges partial results" />
            <Connector />
            <Node label="SSE Stream" sublabel="→ your browser, in real-time" accent />
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {DECISIONS.map((item, i) => (
            <Reveal key={item.title} delay={i * 120}>
              <div className="h-full rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <item.icon className="size-4 text-indigo-400" aria-hidden />
                <h3 className="mt-3 text-[15px] font-medium text-zinc-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {item.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
