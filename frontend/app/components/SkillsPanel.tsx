interface SkillsPanelProps {
  matchedSkills: string[];
  missingSkills: string[];
}

export default function SkillsPanel({ matchedSkills, missingSkills }: SkillsPanelProps) {
  if (matchedSkills.length === 0 && missingSkills.length === 0) return null;

  const rows = [
    ...matchedSkills.map((name) => ({ name, matched: true })),
    ...missingSkills.map((name) => ({ name, matched: false })),
  ];

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-8">
      <p className="text-sm font-medium text-foreground">Skills</p>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li
            key={row.name}
            className="flex items-center justify-between border-b border-border py-2 text-[13px] last:border-b-0"
          >
            <span className="text-foreground">{row.name}</span>
            <span className={row.matched ? "text-success" : "text-danger"}>
              {row.matched ? "Matched" : "Missing"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
