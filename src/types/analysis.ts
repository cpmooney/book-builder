// Analysis types for content quality metrics

export interface TightnessAnalysis {
  score: number; // 1-10 scale
  reasoning: string;
  suggestions: string[];
  timestamp: Date | { seconds: number; nanoseconds: number };
}

export interface SectionAnalysis {
  summary?: string; // Auto-generated summary of the section content
  tightness?: TightnessAnalysis[]; // Array of tightness analysis results
  lastAnalyzed?: Date | { seconds: number; nanoseconds: number };
}

export interface AnalyzeRequest {
  content: string;
  summary: string;
  sectionTitle: string;
}

export interface AnalyzeResponse {
  success: boolean;
  summary?: string;
  tightnessResults?: TightnessAnalysis[];
  error?: string;
}
