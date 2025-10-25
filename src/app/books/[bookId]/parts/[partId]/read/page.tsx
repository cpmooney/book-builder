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

export default function ReadPartPage() {
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
      <button type="button" onClick={() => router.back()} style={{ margin: '40px 0 24px 40px', color: '#007bff', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', position: 'relative', zIndex: 20 }}>← Back</button>
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
      {chapters.length === 0 ? (
        <div style={{ padding: 40 }}>No chapters found.</div>
      ) : (
        chapters.map((chapter, idx) => {
          return (
            <div key={chapter.id} style={{ marginBottom: 64 }}>
              {/* Sticky Chapter Header */}
              <div style={{
                position: 'sticky',
                top: 56,
                zIndex: 9,
                background: 'rgba(255,255,255,0.96)',
                borderBottom: '1px solid #eee',
                padding: '18px 40px 10px 40px',
                fontWeight: 500,
                fontSize: 32,
                boxShadow: '0 1px 6px rgba(0,0,0,0.02)'
              }}>
                Chapter {idx + 1}: {chapter.title}
              </div>
              <div style={{ padding: '0 40px' }}>
                {(sectionsByChapter[chapter.id] || []).map(section => (
                  <div key={section.id} style={{ marginBottom: 48 }}>
                    <h3 style={{ fontSize: 24, marginBottom: 16 }}>{section.title}</h3>
                    <div style={{ fontSize: 18, lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap' }}>{section.content ?? ''}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
