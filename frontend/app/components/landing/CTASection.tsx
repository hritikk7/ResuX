import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

export default function CTASection() {
  return (
    <section id="cta" className="relative overflow-hidden border-t border-white/5 py-28">
      <div
        className="absolute left-1/2 top-1/2 -z-10 h-[20rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-600/20 via-violet-600/15 to-indigo-600/20 blur-3xl"
        aria-hidden
      />
      <Reveal className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          Ready to see where you stand?
        </h2>
        <p className="mt-4 text-sm text-zinc-500 sm:text-base">
          Free. No credit card. Sign in with Google to get started.
        </p>
        <Link
          id="cta-bottom"
          href="/app"
          className="group mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-8 text-[15px] font-medium text-white shadow-[0_0_40px_-8px_rgba(99,102,241,0.7)] transition-shadow hover:shadow-[0_0_56px_-8px_rgba(99,102,241,0.9)]"
        >
          Analyze Your Resume
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </Reveal>
    </section>
  );
}
