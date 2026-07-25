/* lucide-react no longer ships brand icons, so the GitHub mark is inlined. */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.04 11.04 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

const BADGES = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind v4",
  "FastAPI",
  "Supabase",
  "Voyage AI",
  "SSE",
];

export default function Footer() {
  return (
    <footer id="landing-footer" className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {BADGES.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-zinc-500"
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-5 text-sm text-zinc-500">
          <span>
            Built by{" "}
            <a
              id="footer-author"
              href="https://github.com/hritikk7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 transition-colors hover:text-zinc-100"
            >
              Hritik
            </a>
          </span>
          <a
            id="footer-repo"
            href="https://github.com/hritikk7/ResuX"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <GithubIcon className="size-4" />
            Source
          </a>
        </div>
      </div>
    </footer>
  );
}
