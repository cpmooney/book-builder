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
import { listChapters, listSections } from '@/features/books/data';
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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 40, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <button type="button" onClick={() => router.back()} style={{ marginBottom: 24, color: '#007bff', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>← Back</button>
      {chapters.length === 0 ? (
        <div>No chapters found.</div>
      ) : (
        chapters.map((chapter, idx) => {
          // partId may be a string, so use Number.parseInt
          const partNumber = toRoman(Number.parseInt(params.partId as string, 10));
          return (
            <div key={chapter.id} style={{ marginBottom: 64 }}>
              <h1 style={{ fontSize: 32, marginBottom: 24 }}>
                Part {partNumber} &mdash; Chapter {idx + 1}: {chapter.title}
              </h1>
              {(sectionsByChapter[chapter.id] || []).map(section => (
                <div key={section.id} style={{ marginBottom: 48 }}>
                  <h2 style={{ fontSize: 24, marginBottom: 16 }}>{section.title}</h2>
                  <div style={{ fontSize: 18, lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap' }}>{section.content ?? ''}</div>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
