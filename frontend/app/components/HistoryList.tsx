import Link from "next/link";
import type { AnalysisHistoryItem } from "@/lib/types";
import { toPercent } from "@/lib/score";

interface HistoryListProps {
  items: AnalysisHistoryItem[];
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

/** "2 days ago". Intl is enough here — not worth a date library for one format. */
function relativeTime(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  for (const [unit, unitSeconds] of UNITS) {
    if (seconds >= unitSeconds) {
      return formatter.format(-Math.floor(seconds / unitSeconds), unit);
    }
  }
  return "just now";
}

export default function HistoryList({ items }: HistoryListProps) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.id} className="border-b border-border last:border-b-0">
          {/* Negative margin lets the hover fill bleed past the text without
              shifting the row's alignment with the header above it. */}
          <Link
            href={`/dash/history/${item.id}`}
            className="-mx-2 flex items-baseline justify-between gap-4 rounded-md px-2 py-3 transition-colors duration-150 hover:bg-muted/40"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span
                className={
                  item.resume_filename
                    ? "truncate font-mono text-[13px] text-foreground"
                    : "truncate font-mono text-[13px] text-muted-foreground"
                }
              >
                {item.resume_filename ?? "Untitled resume"}
              </span>
              <span className="text-xs text-muted-foreground">
                <time
                  dateTime={item.created_at}
                  title={new Date(item.created_at).toLocaleString()}
                >
                  {relativeTime(item.created_at)}
                </time>
                {` · ${item.matched_skills.length} matched · ${item.missing_skills.length} missing`}
              </span>
            </div>

            <span className="shrink-0 font-mono text-[13px] text-foreground">
              {toPercent(item.score.match_score)}%
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
