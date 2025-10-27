"use client";
import { useEffect, useState } from 'react';
import { getChapterSummary, summarizeSections } from '@/features/books/data';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { Section } from '@/types/book-builder';

export default function SummarizeChapterPage() {
  // Helper to concatenate all summary content for copying
  function getSummaryText() {
    let text = '';
    if (chapter) {
      text += `Chapter: ${chapter.title || ''}\nSummary: ${chapter.summary || 'No summary'}\n\n`;
    }
    summaries.forEach((section, idx) => {
      text += `${idx + 1}. ${section.title}\nSummary: ${section.summary || 'No summary'}\n\n`;
    });
    return text;
  }

  function handleCopy() {
    const text = getSummaryText();
    navigator.clipboard.writeText(text);
  }
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [summaries, setSummaries] = useState<Section[]>([]);
  const [chapter, setChapter] = useState<{ title?: string; summary?: string } | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function fetchSections() {
      setIsLoading(true);
      try {
        if (!user?.uid) {
          alert('User not authenticated');
          setIsLoading(false);
          return;
        }
        const { bookId, partId, chapterId } = params as { bookId: string; partId: string; chapterId: string };
        const chapterSummary = await getChapterSummary(user.uid, bookId, partId, chapterId);
        setChapter({ title: chapterSummary.chapter.title, summary: chapterSummary.chapter.summary });
        const sections = await summarizeSections(user.uid, bookId, partId, chapterId);
        setSummaries(sections);
      } catch (err) {
        alert('Error loading sections');
      } finally {
        setIsLoading(false);
      }
    }
    if (!authLoading) {
      fetchSections();
    }
  }, [user, authLoading, params]);

  if (isLoading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 40, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" onClick={() => router.back()} style={{ marginBottom: 24, color: '#007bff', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>← Back</button>
        <button type="button" onClick={handleCopy} style={{ marginBottom: 24, background: '#28a745', color: 'white', border: 'none', borderRadius: 4, fontSize: 16, padding: '8px 18px', cursor: 'pointer' }}>📋 Copy</button>
      </div>
      <h2 style={{ marginBottom: 16 }}>Summary for Chapter</h2>
      {chapter && (
        <div style={{ marginBottom: 32, padding: '18px', background: '#e9ecef', borderRadius: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{chapter.title}</div>
          <div style={{ fontSize: 16, color: '#444' }}>
            <span style={{ fontWeight: 500, color: '#888' }}>Summary:</span> {chapter.summary || <span style={{ color: '#bbb' }}>No summary</span>}
          </div>
        </div>
      )}
      {summaries.length === 0 ? (
        <div>No summaries found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {summaries.map((section, idx) => (
            <div key={section.id} style={{ padding: '24px', background: '#f8f9fa', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {idx + 1}. {section.title}
              </div>
              <div style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>
                <span style={{ fontWeight: 500, color: '#888' }}>Summary:</span> {section.summary || <span style={{ color: '#bbb' }}>No summary</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
