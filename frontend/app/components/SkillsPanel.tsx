import SectionCard from "@/app/components/SectionCard";

interface SkillsPanelProps {
  matchedSkills: string[];
  missingSkills: string[];
}

export default function SkillsPanel({ matchedSkills, missingSkills }: SkillsPanelProps) {
  if (matchedSkills.length === 0 && missingSkills.length === 0) return null;

  return (
    <SectionCard eyebrow="Skills">
      {matchedSkills.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-muted-foreground">Matched ({matchedSkills.length})</p>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs text-success"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingSkills.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-muted-foreground">Missing ({missingSkills.length})</p>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs text-danger"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
