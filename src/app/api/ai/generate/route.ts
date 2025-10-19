import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side only, no NEXT_PUBLIC_ prefix
});

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      entityType, 
      entityTitle, 
      maxTokens = 300, 
      temperature = 0.7 
    } = await request.json();

    if (!prompt || !entityType || !entityTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, entityType, entityTitle' },
        { status: 400 }
      );
    }

    console.log('🤖 API: Generating AI content for:', { entityType, entityTitle });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert writing assistant specializing in creating concise, professional summaries and content. Generate clear, engaging content that captures the main themes and key points. Keep responses focused and well-structured.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
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

    console.log('✅ API: AI generation successful');
    
    return NextResponse.json({
      success: true,
      content: generatedContent.trim()
    });

  } catch (error) {
    console.error('❌ API AI generation error:', error);
    
    let errorMessage = 'Failed to generate AI content';
    
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