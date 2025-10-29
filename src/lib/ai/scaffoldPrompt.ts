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
  return `
  Parent ${parentType}: "${parentTitle}"

Please convert the following loose content into a JSON array of ${childType}s.

Each item should include:
- "title": A clear, concise title for the ${childType}.
- "summary": A faithful 5–10 sentence summary (roughly 80–120 words). Preserve the original tone, rhythm, and phrasing of the source as much as possible. Capture emotional tone, imagery, and thematic movement rather than reducing to mere facts. Do not over-compress or simplify.

Stay close to the source language — mirror the voice, cadence, and vocabulary of the input text.

Input content:
${content}

CRITICAL: Return ONLY the JSON array with NO additional text, explanations, or formatting. Start your response with [ and end with ]. Do not include any text before or after the JSON array.

Required format (return exactly this structure):
[
  {"title": "Title 1", "summary": "Faithful expanded summary..."},
  {"title": "Title 2", "summary": "Faithful expanded summary..."}
]`;
}
