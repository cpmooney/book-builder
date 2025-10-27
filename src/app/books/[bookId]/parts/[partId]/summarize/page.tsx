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
      {/* You can add summary UI here */}
      <div style={{ padding: '40px' }}>
        <h2>Summary for Part</h2>
        {/* TODO: Add summary logic here */}
      </div>
    </div>
  );
}
