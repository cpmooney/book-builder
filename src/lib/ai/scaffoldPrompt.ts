import type { ChildEntityType } from './ai';

export function getScaffoldPrompt({ content, childType, parentTitle }: {
  content: string;
  childType: ChildEntityType;
  parentTitle: string;
}): string {
  const parentTypeMap = {
    part: 'Book',
    chapter: 'Part',
    section: 'Chapter',
  };
  const parentType = parentTypeMap[childType];
  return `You are an expert content organizer. I need you to parse loose-formatted content into a structured JSON array of ${childType}s.

Parent ${parentType}: "${parentTitle}"

Please convert the following loose content into a JSON array of ${childType}s. Each item should have:
- "title": A clear, concise title for the ${childType}
- "summary": A comprehensive, faithful summary that preserves the richness and detail of the original content

IMPORTANT GUIDANCE FOR SUMMARIES:
• Length: Write 3-5 substantial paragraphs (150-300 words minimum). Be generous with detail.
• Preserve detail: If the source includes bullet points, specific examples, numbers, or key phrases, incorporate them into the summary.
• Stay faithful: Mirror the voice, tone, vocabulary, and phrasing of the original content. Don't simplify or over-compress.
• Capture nuance: Include emotional tone, imagery, thematic elements, and the logical flow of ideas.
• Be complete: Don't leave out important points. If multiple paragraphs or bullet points are provided, ensure all major points are reflected.

Think of the summary as a "detailed abstract" rather than a brief overview. Your goal is to help readers understand what's in the ${childType} WITHOUT reading the full content, while preserving the depth and character of the original.

Input content:
${content}

CRITICAL: Return ONLY the JSON array with NO additional text, explanations, or formatting. Start your response with [ and end with ]. Do not include any text before or after the JSON array.

Required format (return exactly this structure):
[
  {"title": "Title 1", "summary": "Detailed, faithful summary preserving original content..."},
  {"title": "Title 2", "summary": "Detailed, faithful summary preserving original content..."}
]`;
}
