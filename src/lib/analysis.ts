// Client-side analysis utilities that call server-side API routes

import type { AnalyzeRequest, AnalyzeResponse } from '@/types/analysis';

// Configuration: Number of tightness analysis attempts to perform
export const TIGHTNESS_ANALYSIS_ATTEMPTS = 2;

/**
 * Analyze section content for tightness and generate summary
 */
export async function analyzeSection({
  content,
  summary,
  sectionTitle
}: AnalyzeRequest): Promise<AnalyzeResponse> {
  try {
    console.log('🔍 Calling analysis API for:', sectionTitle);
    
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        summary,
        sectionTitle
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`
      };
    }

    const result = await response.json();
    console.log('✅ Analysis API call successful');
    
    return result;

  } catch (error) {
    console.error('❌ Analysis API error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze section'
    };
  }
}

/**
 * Create prompt for generating section summary
 */
export function createSectionSummaryPrompt(
  sectionTitle: string,
  content: string
): string {
  return `Please generate a concise, professional summary of this section.

Section Title: ${sectionTitle}

Content:
${content}

Generate a summary in 2-3 clear sentences that captures the main themes and key points of this section.`;
}

/**
 * Create prompt for analyzing tightness of section
 */
export function createTightnessAnalysisPrompt(
  sectionTitle: string,
  summary: string,
  content: string
): string {
  return `You are a writing quality analyst. Analyze the "tightness" of this section - how well it stays focused on a single theme without wandering.

Section Title: ${sectionTitle}

Summary: ${summary}

Content:
${content}

Rate the tightness on a scale of 1-10, where:
- 1-3: Very scattered, covers many unrelated topics
- 4-6: Somewhat focused but includes tangential material
- 7-8: Well-focused with minor digressions
- 9-10: Extremely tight, every sentence supports the main theme

Provide your response in the following JSON format:
{
  "score": <number between 1-10>,
  "reasoning": "<2-3 sentences explaining why you gave this score>",
  "suggestions": ["<specific suggestion 1>", "<specific suggestion 2>", "<specific suggestion 3>"]
}

Return ONLY valid JSON with no additional text or formatting.`;
}
