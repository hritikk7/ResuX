// Mirrors backend/models/analysis.py and the SSE payloads emitted by
// POST /analyze (backend/main.py). Keep in sync with the backend.

export interface ScoreBreakdown {
  keyword_score: number;
  similarity_score: number;
  experience_score: number;
  match_score: number;
  required_years: number | null;
  candidate_years: number;
}

export interface ResultPartial {
  score: ScoreBreakdown;
  skills: string[];
  matched_skills: string[];
  missing_skills: string[];
}

export interface BulletResult {
  original: string;
  rewritten: string | null;
  is_valid: boolean;
  invalid_terms?: string[];
  error?: string;
}

export interface AnalysisResult {
  raw_text: string;
  bullets: string[];
  char_count: number;
  skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  score: ScoreBreakdown;
  bullet_rewrites: BulletResult[];
}

export interface ErrorPayload {
  error: string;
  message: string;
}

export type SSEEvent =
  | { type: "status"; payload: string }
  | { type: "result_partial"; payload: ResultPartial }
  | { type: "bullet_result"; payload: BulletResult }
  | { type: "result_final"; payload: AnalysisResult }
  | { type: "error"; payload: ErrorPayload };
