interface SectionCardProps {
  /** Short uppercase micro-label shown above the section's content. */
  eyebrow: string;
  children: React.ReactNode;
}

/**
 * Shared "gradient-border card" wrapper (docs/design.md is intentionally
 * overridden here — see the dashboard restyle plan). Built from the existing
 * --border token rather than a hardcoded color, so the 1px gradient border
 * stays correct in both light and dark automatically.
 */
export default function SectionCard({ eyebrow, children }: SectionCardProps) {
  return (
    <section className="rounded-xl bg-gradient-to-b from-border to-transparent p-px">
      <div className="flex flex-col gap-4 rounded-[calc(0.75rem-1px)] bg-background px-5 py-5">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        {children}
      </div>
    </section>
  );
}
