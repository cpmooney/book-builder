import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { 
  createSectionSummaryPrompt, 
  createTightnessAnalysisPrompt,
  TIGHTNESS_ANALYSIS_ATTEMPTS 
} from '@/lib/analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TightnessResult {
  score: number;
  reasoning: string;
  suggestions: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { content, summary, sectionTitle } = await request.json();

    if (!content || !sectionTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: content, sectionTitle' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Analyzing section:', sectionTitle);

    // Step 1: Generate or use existing summary
    let finalSummary = summary;
    if (!summary) {
      console.log('📝 Generating summary...');
      const summaryPrompt = createSectionSummaryPrompt(sectionTitle, content);
      
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert writing assistant specializing in creating concise, professional summaries.'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      finalSummary = summaryResponse.choices[0]?.message?.content?.trim() || '';
      console.log('✅ Summary generated');
    }

    // Step 2: Perform multiple tightness analyses
    console.log(`🎯 Running ${TIGHTNESS_ANALYSIS_ATTEMPTS} tightness analysis attempts...`);
    const tightnessPrompt = createTightnessAnalysisPrompt(sectionTitle, finalSummary, content);
    
    const analysisPromises = Array.from({ length: TIGHTNESS_ANALYSIS_ATTEMPTS }, async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a precise writing quality analyst. Return ONLY valid JSON with no explanatory text, markdown, or formatting.'
          },
          {
            role: 'user',
            content: tightnessPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        throw new Error('No content generated from AI');
      }

      // Clean up the response
      let cleanedContent = rawContent
        .replaceAll(/```json\n?/g, '')
        .replaceAll(/```\n?/g, '')
        .trim();
      
      // Extract JSON from the response
      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = jsonRegex.exec(cleanedContent);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }

      const parsed: TightnessResult = JSON.parse(cleanedContent);
      
      // Validate structure
      if (typeof parsed.score !== 'number' || 
          typeof parsed.reasoning !== 'string' || 
          !Array.isArray(parsed.suggestions)) {
        throw new TypeError('Invalid tightness analysis structure');
      }

      return {
        score: parsed.score,
        reasoning: parsed.reasoning,
        suggestions: parsed.suggestions,
        timestamp: new Date()
      };
    });

    const tightnessResults = await Promise.all(analysisPromises);
    console.log(`✅ Completed ${tightnessResults.length} tightness analyses`);

    return NextResponse.json({
      success: true,
      summary: finalSummary,
      tightnessResults
    });

  } catch (error) {
    console.error('❌ API Analysis error:', error);
    
    let errorMessage = 'Failed to analyze section';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Handle specific OpenAI errors
    if (error && typeof error === 'object' && 'status' in error) {
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid API key configuration';
          break;
        case 429:
          errorMessage = 'Rate limit exceeded. Please try again later.';
          break;
        case 500:
          errorMessage = 'OpenAI service error. Please try again later.';
          break;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
