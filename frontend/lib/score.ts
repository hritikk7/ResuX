/** Score formatting shared by the analysis page and the history list.
 *
 * The backend stores every score as a 0–1 float (backend/models/analysis.py
 * ScoreBreakdown); percentages exist only at render time.
 */

export function toPercent(value: number): number {
  return Math.round(value * 100);
}

export function qualitativeLabel(matchPercent: number): string {
  if (matchPercent >= 80) return "Strong alignment";
  if (matchPercent >= 60) return "Good alignment";
  if (matchPercent >= 40) return "Moderate alignment";
  return "Limited alignment";
}
