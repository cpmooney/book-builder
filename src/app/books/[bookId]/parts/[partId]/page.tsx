'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBookTOC, createChapter, updateChapter, deleteChapter } from '../../../../../features/books/data';
import { useAuth } from '../../../../../components/AuthProvider';
import ChapterEdit from '../../../../../components/ChapterEdit';

export default function PartPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [partData, setPartData] = useState<any>(null);
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chapterEditModalOpen, setChapterEditModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<{
    id: string;
    title: string;
    summary: string;
  } | null>(null);

  const bookId = params.bookId as string;
  const partId = params.partId as string;

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !bookId || !partId) return;
      
      try {
        setLoading(true);
        const data = await getBookTOC(user.uid, bookId);
        setBookData(data);
        
        // Find the specific part
        const currentPart = data.parts?.find((p: any) => p.part.id === partId);
        setPartData(currentPart);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid, bookId, partId]);

  const handleAddChapter = async () => {
    if (!user?.uid) return;

    try {
      await createChapter(user.uid, bookId, partId, {
        title: 'New Chapter',
        summary: ''
      });
      // Reload data
      const data = await getBookTOC(user.uid, bookId);
      setBookData(data);
      const currentPart = data.parts?.find((p: any) => p.part.id === partId);
      setPartData(currentPart);
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Error creating chapter');
    }
  };

  const handleEditChapter = (chapterId: string, title: string, summary: string) => {
    setEditingChapter({ id: chapterId, title, summary });
    setChapterEditModalOpen(true);
  };

  const handleSaveChapter = async (title: string, summary: string) => {
    if (!editingChapter || !user?.uid) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (title !== editingChapter.title) {
        updateData.title = title;
      }
      if (summary !== editingChapter.summary) {
        updateData.summary = summary;
      }

      if (Object.keys(updateData).length > 0) {
        await updateChapter(user.uid, bookId, partId, editingChapter.id, updateData);
        // Reload data
        const data = await getBookTOC(user.uid, bookId);
        setBookData(data);
        const currentPart = data.parts?.find((p: any) => p.part.id === partId);
        setPartData(currentPart);
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      alert('Error updating chapter');
      throw error;
    }
  };

  const handleDeleteChapter = async (chapterId: string, chapterTitle: string) => {
    if (!user?.uid) return;
    
    if (confirm(`Are you sure you want to delete the chapter "${chapterTitle}"? This will also delete all its sections.`)) {
      try {
        await deleteChapter(user.uid, bookId, partId, chapterId);
        // Reload data
        const data = await getBookTOC(user.uid, bookId);
        setBookData(data);
        const currentPart = data.parts?.find((p: any) => p.part.id === partId);
        setPartData(currentPart);
        alert('Chapter deleted successfully');
      } catch (error) {
        console.error('Error deleting chapter:', error);
        alert('Error deleting chapter');
      }
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading part...</div>;
  }

  if (!partData || !bookData) {
    return <div style={{ padding: '20px' }}>Part not found</div>;
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
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h1>{partData.part.title}</h1>
        {partData.part.summary && (
          <p style={{ color: '#666', fontSize: '16px', marginTop: '10px' }}>
            {partData.part.summary}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={handleAddChapter}
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
          + Add Chapter
        </button>
      </div>

      <div>
        <h2>Chapters</h2>
        {partData.chapters && partData.chapters.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {partData.chapters.map((chapter: any) => (
              <div
                key={chapter.id}
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
                      href={`/books/${bookId}/parts/${partId}/chapters/${chapter.id}`}
                      style={{ 
                        textDecoration: 'none', 
                        color: '#007bff',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      {chapter.title}
                    </Link>
                    {chapter.summary && (
                      <p style={{ 
                        color: '#666', 
                        fontSize: '14px', 
                        marginTop: '8px',
                        fontStyle: 'italic'
                      }}>
                        {chapter.summary}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleEditChapter(chapter.id, chapter.title, chapter.summary || '')}
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
                      onClick={() => handleDeleteChapter(chapter.id, chapter.title)}
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
                  <strong>Sections: </strong>
                  {chapter.sections && chapter.sections.length > 0 ? (
                    <span>{chapter.sections.length}</span>
                  ) : (
                    <span style={{ color: '#999' }}>No sections yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>No chapters yet. Add your first chapter to get started.</p>
        )}
      </div>

      <ChapterEdit
        isOpen={chapterEditModalOpen}
        onClose={() => setChapterEditModalOpen(false)}
        onSave={handleSaveChapter}
        initialTitle={editingChapter?.title || ''}
        initialSummary={editingChapter?.summary || ''}
      />
    </div>
  );
}