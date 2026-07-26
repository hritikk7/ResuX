import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import HeroMockup from "./HeroMockup";

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
      {/* dot grid, faded out radially from the top center */}
      <div
        className="absolute inset-0 -z-20 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_10%,transparent_80%)]"
        aria-hidden
      />
      {/* indigo/violet glow */}
      <div
        className="absolute left-1/2 top-[-12rem] -z-10 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600/25 via-violet-600/20 to-indigo-600/25 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[11px] text-zinc-400">
          <span className="size-1.5 rounded-full bg-indigo-400" aria-hidden />
          Score + skills stream in under a second
        </p>

        <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
          Know exactly where your resume{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
            falls short
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-zinc-400 sm:text-lg">
          ResuX compares your resume against any job description and streams
          back a transparent match score, the exact skills you&apos;re missing,
          and AI-rewritten bullets grounded in what you&apos;ve actually done.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            id="hero-cta-primary"
            href="/dash"
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 text-sm font-medium text-white shadow-[0_0_32px_-6px_rgba(99,102,241,0.6)] transition-shadow hover:shadow-[0_0_44px_-6px_rgba(99,102,241,0.8)]"
          >
            Analyze Your Resume
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <a
            id="hero-cta-secondary"
            href="#how-it-works"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-100"
          >
            See How It Works
            <ChevronDown className="size-4" aria-hidden />
          </a>
        </div>
      </div>

      <div className="mx-auto mt-16 px-6">
        <HeroMockup />
      </div>
    </section>
  );
}
