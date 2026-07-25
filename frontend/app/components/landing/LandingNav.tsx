import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingNav() {
  return (
    <header
      id="landing-nav"
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#09090b]/70 backdrop-blur-md"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          id="nav-logo"
          href="/"
          className="text-[15px] font-semibold tracking-tight text-zinc-100"
        >
          Resu
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            X
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] text-zinc-400 md:flex">
          <a id="nav-how" href="#how-it-works" className="transition-colors hover:text-zinc-100">
            How it works
          </a>
          <a id="nav-features" href="#features" className="transition-colors hover:text-zinc-100">
            Features
          </a>
          <a id="nav-demo" href="#demo" className="transition-colors hover:text-zinc-100">
            Demo
          </a>
          <a
            id="nav-architecture"
            href="#architecture"
            className="transition-colors hover:text-zinc-100"
          >
            Architecture
          </a>
        </nav>

        <Link
          id="nav-cta"
          href="/app"
          className="group inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 text-[13px] font-medium text-white shadow-[0_0_20px_-4px_rgba(99,102,241,0.5)] transition-shadow hover:shadow-[0_0_28px_-4px_rgba(99,102,241,0.7)]"
        >
          Analyze Your Resume
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </header>
  );
}
