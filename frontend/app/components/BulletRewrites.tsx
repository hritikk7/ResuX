"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { BulletResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SectionCard from "@/app/components/SectionCard";

interface BulletRewritesProps {
  bullets: BulletResult[];
  /** 1-based index of the bullet currently being rewritten, if any (see app/dash/page.tsx). */
  pendingIndex?: number | null;
}

async function handleCopy(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

export default function BulletRewrites({ bullets, pendingIndex }: BulletRewritesProps) {
  if (bullets.length === 0 && !pendingIndex) return null;

  return (
    <SectionCard eyebrow="Resume suggestions">
      <ul className="flex flex-col gap-5">
        {bullets.map((bullet, i) => {
          // Guardrail rejection (introduced unverifiable content) vs. an
          // outright generation failure — both render as a muted "rejected"
          // row, but with the reason that actually applies.
          const rejected = !bullet.is_valid || !bullet.rewritten;

          return (
            <li key={i} className="flex flex-col gap-2 text-[13px]">
              <div>
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-muted-foreground line-through decoration-border">
                  {bullet.original}
                </p>
              </div>

              {!rejected ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">Suggested</p>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-foreground">{bullet.rewritten}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      onClick={() => handleCopy(bullet.rewritten!)}
                      title="Copy"
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {bullet.invalid_terms && bullet.invalid_terms.length > 0
                    ? `suggestion skipped — introduced an unlisted skill (${bullet.invalid_terms.join(", ")})`
                    : "suggestion skipped — couldn't produce a verified rewrite"}
                </p>
              )}
            </li>
          );
        })}

        {pendingIndex != null && (
          <li className="flex flex-col gap-2 text-[13px]">
            <p className="text-xs text-muted-foreground">
              Rewriting suggestion {pendingIndex}…
            </p>
            <Skeleton className="h-4 w-3/4" />
          </li>
        )}
      </ul>
    </SectionCard>
  );
}
