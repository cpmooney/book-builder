"use client";
// Utility to convert number to Roman numerals
function toRoman(num: number): string {
  const romanNumerals: [string, number][] = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ];
  let result = '';
  for (const [roman, value] of romanNumerals) {
    while (num >= value) {
      result += roman;
      num -= value;
    }
  }
  return result;
}

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPartTitleAndNumber, listChapters, listSections } from '@/features/books/data';
import { useAuth } from '@/components/AuthProvider';

interface Section {
  id: string;
  title: string;
  content?: string;
}
interface Chapter {
  id: string;
  title: string;
}

export default function SummarizePartPage() {
  // Helper to concatenate all summary content for copying
  function getSummaryText() {
    let text = '';
    if (partInfo) {
      text += `Part ${toRoman(partInfo.partNumber)} ${partInfo.title}\n`;
    }
    for (const [chapterIdx, chapter] of chapters.entries()) {
      text += `\nChapter ${chapterIdx + 1}: ${chapter.title}\n`;
      const sections = sectionsByChapter[chapter.id] || [];
      for (const [sectionIdx, section] of sections.entries()) {
        text += `  ${sectionIdx + 1}. ${section.title}\n  Summary: ${section.summary || 'No summary'}\n`;
      }
    }
    return text;
  }

  function handleCopy() {
    const text = getSummaryText();
    navigator.clipboard.writeText(text);
  }
  // ...existing code from ReadPartPage, but you can add summary logic here...
  const router = useRouter();
  const params = useParams();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sectionsByChapter, setSectionsByChapter] = useState<Record<string, Section[]>>({});
  const [partInfo, setPartInfo] = useState<{ title: string; partNumber: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function fetchChaptersAndSections() {
      setIsLoading(true);
      try {
        if (!user?.uid) {
          alert('User not authenticated');
          setIsLoading(false);
          return;
        }
        const { bookId, partId } = params as { bookId: string; partId: string };
        const chapters = await listChapters(user.uid, bookId, partId);
        const thisPartInfo = await getPartTitleAndNumber(user.uid, bookId, partId);
        setPartInfo(thisPartInfo);
        setChapters(chapters || []);
        const sectionsMap: Record<string, Section[]> = {};
        for (const chapter of chapters) {
          const sections = await listSections(user.uid, bookId, partId, chapter.id);
          sectionsMap[chapter.id] = sections || [];
        }
        setSectionsByChapter(sectionsMap);
      } catch {
        alert('Error loading chapters or sections');
      } finally {
        setIsLoading(false);
      }
    }
    if (!authLoading) {
      fetchChaptersAndSections();
    }
  }, [user, authLoading, params]);

  if (isLoading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" onClick={() => router.back()} style={{ margin: '40px 0 24px 40px', color: '#007bff', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', position: 'relative', zIndex: 20 }}>← Back</button>
        <button type="button" onClick={handleCopy} style={{ margin: '40px 0 24px 0', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, fontSize: 16, padding: '8px 18px', cursor: 'pointer', position: 'relative', zIndex: 20 }}>📋 Copy</button>
      </div>
      {/* Sticky Part Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(255,255,255,0.97)',
        borderBottom: '2px solid #eee',
        padding: '24px 40px 12px 40px',
        fontWeight: 600,
        fontSize: 22,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        Part {toRoman(partInfo?.partNumber ?? 0)} {partInfo?.title}
      </div>
      <div style={{ padding: '40px' }}>
        <h2>Summary for Part</h2>
        {chapters.length === 0 ? (
          <div>No chapters found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {chapters.map((chapter, chapterIdx) => (
              <div key={chapter.id} style={{ padding: '24px', background: '#e9ecef', borderRadius: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Chapter {chapterIdx + 1}: {chapter.title}</div>
                {/* If chapter.summary exists, display it here. If not, skip. */}
                {chapter.summary && (
                  <div style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>
                    <span style={{ fontWeight: 500, color: '#888' }}>Summary:</span> {chapter.summary}
                  </div>
                )}
                {/* Section summaries */}
                {(sectionsByChapter[chapter.id] || []).length === 0 ? (
                  <div style={{ color: '#bbb' }}>No sections found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {sectionsByChapter[chapter.id].map((section, sectionIdx) => (
                      <div key={section.id} style={{ padding: '16px', background: '#f8f9fa', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{sectionIdx + 1}. {section.title}</div>
                        <div style={{ fontSize: 15, color: '#444' }}>
                          <span style={{ fontWeight: 500, color: '#888' }}>Summary:</span> {section.summary || <span style={{ color: '#bbb' }}>No summary</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
