"use client";
import { useEffect, useState } from 'react';
import { listSections } from '@/features/books/data';
import { useAuth } from '@/components/AuthProvider';

import { useRouter, useParams } from 'next/navigation';

interface Section {
  id: string;
  title: string;
  content?: string;
}

export default function ReadPage() {
  const router = useRouter();
  const params = useParams();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        const sections = await listSections(user.uid, bookId, partId, chapterId);
        setSections(sections || []);
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
      <button type="button" onClick={() => router.back()} style={{ marginBottom: 24, color: '#007bff', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>← Back</button>
      {sections.length === 0 ? (
        <div>No sections found.</div>
      ) : (
        sections.map(section => (
          <div key={section.id} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>{section.title}</h2>
            <div style={{ fontSize: 18, lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap' }}>{section.content ?? ''}</div>
          </div>
        ))
      )}
    </div>
  );
}
