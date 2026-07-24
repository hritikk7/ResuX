import type { ScoreBreakdown } from "@/lib/types";

interface ScoreCardProps {
  score: ScoreBreakdown;
}

function toPercent(value: number): number {
  return Math.round(value * 100);
}

function qualitativeLabel(matchPercent: number): string {
  if (matchPercent >= 80) return "Strong alignment";
  if (matchPercent >= 60) return "Good alignment";
  if (matchPercent >= 40) return "Moderate alignment";
  return "Limited alignment";
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const {
    keyword_score,
    similarity_score,
    experience_score,
    match_score,
    required_years,
    candidate_years,
  } = score;

  const matchPercent = toPercent(match_score);

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex items-baseline gap-3">
        <p className="font-mono text-4xl font-semibold tracking-tight text-foreground">
          {matchPercent}%
        </p>
        <div className="flex flex-col">
          <p className="text-[13px] text-foreground">Match score</p>
          <p className="text-xs text-muted-foreground">{qualitativeLabel(matchPercent)}</p>
        </div>
      </div>

      <dl className="flex flex-col gap-1.5 text-[13px]">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Keyword</dt>
          <dd className="font-mono text-foreground">{toPercent(keyword_score)}%</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Semantic</dt>
          <dd className="font-mono text-foreground">{toPercent(similarity_score)}%</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Experience</dt>
          <dd className="font-mono text-foreground">{toPercent(experience_score)}%</dd>
        </div>
      </dl>

      <p className="text-xs text-muted-foreground">
        {required_years != null
          ? `Role expects ~${required_years} yr${required_years === 1 ? "" : "s"} experience · résumé shows ~${candidate_years} yr${candidate_years === 1 ? "" : "s"}.`
          : `No experience requirement detected in the job description · résumé shows ~${candidate_years} yr${candidate_years === 1 ? "" : "s"}.`}
      </p>
    </section>
  );
}
