'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBookTOC, createSection, updateSection, deleteSection } from '../../../../../../../features/books/data';
import { useAuth } from '../../../../../../../components/AuthProvider';

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [chapterData, setChapterData] = useState<any>(null);
  const [bookData, setBookData] = useState<any>(null);
  const [partData, setPartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bookId = params.bookId as string;
  const partId = params.partId as string;
  const chapterId = params.chapterId as string;

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !bookId || !partId || !chapterId) return;
      
      try {
        setLoading(true);
        const data = await getBookTOC(user.uid, bookId);
        setBookData(data);
        
        // Find the specific part and chapter
        const currentPart = data.parts?.find((p: any) => p.part.id === partId);
        setPartData(currentPart);
        
        const currentChapter = currentPart?.chapters?.find((c: any) => c.id === chapterId);
        setChapterData(currentChapter);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid, bookId, partId, chapterId]);

  const handleAddSection = async () => {
    if (!user?.uid) return;

    try {
      await createSection(user.uid, bookId, partId, chapterId, {
        title: 'New Section',
        summary: ''
      });
      // Reload data
      const data = await getBookTOC(user.uid, bookId);
      setBookData(data);
      const currentPart = data.parts?.find((p: any) => p.part.id === partId);
      setPartData(currentPart);
      const currentChapter = currentPart?.chapters?.find((c: any) => c.id === chapterId);
      setChapterData(currentChapter);
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Error creating section');
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading chapter...</div>;
  }

  if (!chapterData || !bookData || !partData) {
    return <div style={{ padding: '20px' }}>Chapter not found</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/books" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Books
        </Link>
        <span style={{ margin: '0 8px', color: '#666' }}>/</span>
        <Link href={`/books/${bookId}`} style={{ color: '#007bff', textDecoration: 'none' }}>
          {bookData.title}
        </Link>
        <span style={{ margin: '0 8px', color: '#666' }}>/</span>
        <Link href={`/books/${bookId}/parts/${partId}`} style={{ color: '#007bff', textDecoration: 'none' }}>
          {partData.part.title}
        </Link>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h1>{chapterData.title}</h1>
        {chapterData.summary && (
          <p style={{ color: '#666', fontSize: '16px', marginTop: '10px' }}>
            {chapterData.summary}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={handleAddSection}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Add Section
        </button>
      </div>

      <div>
        <h2>Sections</h2>
        {chapterData.sections && chapterData.sections.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chapterData.sections.map((section: any) => (
              <div
                key={section.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <Link 
                      href={`/books/${bookId}/parts/${partId}/chapters/${chapterId}/sections/${section.id}`}
                      style={{ 
                        textDecoration: 'none', 
                        color: '#007bff',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      {section.title}
                    </Link>
                    {section.summary && (
                      <p style={{ 
                        color: '#666', 
                        fontSize: '14px', 
                        marginTop: '8px',
                        fontStyle: 'italic'
                      }}>
                        {section.summary}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div>
                  <strong>Blocks: </strong>
                  {section.blocks && section.blocks.length > 0 ? (
                    <span>{section.blocks.length}</span>
                  ) : (
                    <span style={{ color: '#999' }}>No blocks yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>No sections yet. Add your first section to get started.</p>
        )}
      </div>
    </div>
  );
}