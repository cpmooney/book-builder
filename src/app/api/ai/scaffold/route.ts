import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChildEntityType, ScaffoldItem } from '@/lib/ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side only, no NEXT_PUBLIC_ prefix
});

export async function POST(request: NextRequest) {
  try {
    const { content, childType, parentTitle, maxTokens = 1000 } = await request.json();

    if (!content || !childType || !parentTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: content, childType, parentTitle' },
        { status: 400 }
      );
    }

    console.log('🏗️ API: Scaffolding children for:', { childType, parentTitle });

    const parentTypeMap = {
      part: 'Book',
      chapter: 'Part', 
      section: 'Chapter'
    };

    const parentType = parentTypeMap[childType as ChildEntityType];
    
    const prompt = `You are an expert content organizer. I need you to parse loose-formatted content into a structured JSON array of ${childType}s.

Parent ${parentType}: "${parentTitle}"

Please convert the following loose content into a JSON array of ${childType}s. Each item should have:
- "title": A clear, concise title for the ${childType}
- "summary": A professional 2-3 sentence summary expanding on the content provided

Input content:
${content}

Important instructions:
1. Return ONLY a valid JSON array, nothing else
2. Each ${childType} should have exactly these fields: {"title": "...", "summary": "..."}
3. Create meaningful summaries that expand on the brief descriptions provided
4. Ensure titles are clear and descriptive
5. The JSON must be valid and parseable

Expected format:
[
  {"title": "Title 1", "summary": "Detailed summary..."},
  {"title": "Title 2", "summary": "Detailed summary..."}
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a precise content organizer. Always return valid JSON arrays only, with no additional text or formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const generatedContent = response.choices[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'No content generated from AI' },
        { status: 500 }
      );
    }

    try {
      // Clean up the response - remove any markdown code blocks or extra text
      const cleanedContent = generatedContent
        .replaceAll(/```json\n?/g, '')
        .replaceAll(/```\n?/g, '')
        .trim();
      
      const parsedItems: ScaffoldItem[] = JSON.parse(cleanedContent);
      
      if (!Array.isArray(parsedItems)) {
        throw new TypeError('Response is not an array');
      }
      
      // Validate each item has required fields
      for (const item of parsedItems) {
        if (!item.title || !item.summary) {
          throw new Error('Invalid item structure - missing title or summary');
        }
      }

      console.log(`✅ API: Successfully scaffolded ${parsedItems.length} ${childType}s`);
      
      return NextResponse.json({
        success: true,
        items: parsedItems
      });

    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { error: 'AI generated invalid JSON format. Please try again with clearer formatting.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ API Scaffolding error:', error);
    
    let errorMessage = 'Failed to scaffold content';
    
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