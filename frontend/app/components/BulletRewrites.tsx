import type { BulletResult } from "@/lib/types";

interface BulletRewritesProps {
  bullets: BulletResult[];
}

export default function BulletRewrites({ bullets }: BulletRewritesProps) {
  if (bullets.length === 0) return null;

  return (
    <section className="flex flex-col gap-5 border-t border-border pt-8">
      <p className="text-sm font-medium text-foreground">Bullet rewrites</p>
      <ul className="flex flex-col gap-5">
        {bullets.map((bullet, i) => (
          <li key={i} className="flex flex-col gap-2 text-sm">
            <p className="text-muted line-through decoration-border">{bullet.original}</p>
            {bullet.is_valid && bullet.rewritten ? (
              <p className="text-foreground">{bullet.rewritten}</p>
            ) : (
              <p className="text-xs text-muted italic">
                Couldn&apos;t produce a verified rewrite for this bullet
                {bullet.invalid_terms && bullet.invalid_terms.length > 0
                  ? ` (introduced unverifiable terms: ${bullet.invalid_terms.join(", ")}).`
                  : "."}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
