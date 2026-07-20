import type { ScoreBreakdown } from "@/lib/types";

interface ScoreCardProps {
  score: ScoreBreakdown;
}

function toPercent(value: number): number {
  return Math.round(value * 100);
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const { keyword_score, similarity_score, experience_score, match_score, required_years, candidate_years } = score;

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <div>
        <p className="text-sm font-medium text-muted">Semantic Match Score</p>
        <p className="text-5xl font-semibold tracking-tight text-foreground">
          {toPercent(match_score)}%
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-6 text-sm">
        <div>
          <dt className="text-muted">Keyword</dt>
          <dd className="text-lg font-medium text-foreground">{toPercent(keyword_score)}%</dd>
        </div>
        <div>
          <dt className="text-muted">Semantic</dt>
          <dd className="text-lg font-medium text-foreground">{toPercent(similarity_score)}%</dd>
        </div>
        <div>
          <dt className="text-muted">Experience</dt>
          <dd className="text-lg font-medium text-foreground">{toPercent(experience_score)}%</dd>
        </div>
      </dl>

      <p className="text-xs text-muted">
        {required_years != null
          ? `Role expects ~${required_years} yr${required_years === 1 ? "" : "s"} experience · résumé shows ~${candidate_years} yr${candidate_years === 1 ? "" : "s"}.`
          : `No experience requirement detected in the job description · résumé shows ~${candidate_years} yr${candidate_years === 1 ? "" : "s"}.`}
      </p>
    </section>
  );
}
