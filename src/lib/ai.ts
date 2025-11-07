// Client-side AI utilities that call server-side API routes

export type EntityType = 'book' | 'part' | 'chapter' | 'section';

export interface AIGenerationRequest {
  prompt: string;
  entityType: EntityType;
  entityTitle: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerationResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Generate AI content using server-side API route
 */
export async function generateWithAI({
  prompt,
  entityType,
  entityTitle,
  maxTokens = 300,
  temperature = 0.7
}: AIGenerationRequest): Promise<AIGenerationResult> {
  try {
    console.log('🤖 Calling AI generation API for:', { entityType, entityTitle });
    
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        entityType,
        entityTitle,
        maxTokens,
        temperature
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
    console.log('✅ AI generation API call successful');
    
    return result;

  } catch (error) {
    console.error('❌ AI generation API error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate AI content'
    };
  }
}

/**
 * Helper function to create a prompt for summary generation
 */
export function createSummaryPrompt(
  entityType: 'book' | 'part' | 'chapter' | 'section',
  title: string,
  content: string,
  currentSummary?: string
): string {
  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  
  let prompt = `Please generate a concise, professional summary for this ${entityType}.\n\n`;
  
  prompt += `${entityLabel} Title: ${title}\n\n`;
  
  if (currentSummary) {
    prompt += `Current Summary: ${currentSummary}\n\n`;
  }
  
  if (content.trim()) {
    prompt += `Content to summarize:\n${content}\n\n`;
  } else {
    prompt += 'No content available yet.\n\n';
  }
  
  prompt += `Generate a ${entityType} summary in 2-3 clear, engaging sentences that capture the main themes and key points. Focus on what makes this ${entityType} valuable and interesting to readers.`;
  
  return prompt;
}

/**
 * Helper function to create a prompt for content generation
 */
export function createContentPrompt(
  entityType: 'book' | 'part' | 'chapter' | 'section',
  title: string,
  summary?: string,
  additionalContext?: string
): string {
  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  
  let prompt = `Please generate detailed content for this ${entityType}.\n\n`;
  
  prompt += `${entityLabel} Title: ${title}\n\n`;
  
  if (summary) {
    prompt += `Summary: ${summary}\n\n`;
  }
  
  if (additionalContext) {
    prompt += `Additional Context: ${additionalContext}\n\n`;
  }
  
  prompt += `Generate comprehensive, well-structured content for this ${entityType}. Include relevant details, examples, and insights that would be valuable to readers. Format the content with appropriate paragraphs and structure.`;
  
  return prompt;
}

export interface ScaffoldItem {
  title: string;
  summary: string;
}

export interface ScaffoldResult {
  success: boolean;
  items?: ScaffoldItem[];
  error?: string;
}

export type ChildEntityType = 'part' | 'chapter' | 'section';

// Helper functions moved to API routes for security

/**
 * Parse loose-formatted content into structured child items using AI API
 */
export async function scaffoldChildren({
  content,
  childType,
  parentTitle,
  maxTokens = 4000
}: {
  content: string;
  childType: ChildEntityType;
  parentTitle: string;
  maxTokens?: number;
}): Promise<ScaffoldResult> {
  try {
    console.log('🏗️ Calling scaffold API for:', { childType, parentTitle });
    
    const response = await fetch('/api/ai/scaffold', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        childType,
        parentTitle,
        maxTokens
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
    console.log('✅ Scaffold API call successful');
    
    return result;

  } catch (error) {
    console.error('❌ Scaffold API error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scaffold content'
    };
  }
}