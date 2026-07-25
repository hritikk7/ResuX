const STACK = ["Next.js", "FastAPI", "Gemini", "Supabase", "Voyage AI"];

export default function BuiltWithBar() {
  return (
    <section id="built-with" aria-label="Built with" className="border-y border-white/5 py-8">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6">
        <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">
          Built with
        </span>
        {STACK.map((name) => (
          <span
            key={name}
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
