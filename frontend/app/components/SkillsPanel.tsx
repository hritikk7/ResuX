interface SkillsPanelProps {
  matchedSkills: string[];
  missingSkills: string[];
}

export default function SkillsPanel({ matchedSkills, missingSkills }: SkillsPanelProps) {
  if (matchedSkills.length === 0 && missingSkills.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      {missingSkills.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Missing skills</p>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-accent/40 px-3 py-1 text-xs text-accent"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {matchedSkills.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Matched skills</p>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
