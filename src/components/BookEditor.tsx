'use client';

import { useState, useEffect } from 'react';
import { 
  createPart, 
  createChapter, 
  createSection, 
  createBlock, 
  updateBlock,
  updatePart,
  deletePart,
  updateChapter,
  deleteChapter,
  getBookTOC
} from '../features/books/data';
import PartEdit from './PartEdit';
import ChapterEdit from './ChapterEdit';

interface BookEditorProps {
  userId: string;
  bookId: string;
}

export default function BookEditor({ userId, bookId }: Readonly<BookEditorProps>) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<{
    id: string;
    title: string;
    summary: string;
  } | null>(null);
  const [chapterEditModalOpen, setChapterEditModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<{
    id: string;
    partId: string;
    title: string;
    summary: string;
  } | null>(null);

  const handleAddPart = async () => {
    try {
      await createPart(userId, bookId, {
        title: 'New Part',
        summary: 'A new part in the book'
      });
      // Reload the book data
      const data = await getBookTOC(userId, bookId);
      setBookData(data);
    } catch (error) {
      console.error('Error creating part:', error);
      alert('Error creating part');
    }
  };

  const handleEditPart = (partId: string, currentTitle: string, currentSummary?: string) => {
    setEditingPart({
      id: partId,
      title: currentTitle,
      summary: currentSummary || ''
    });
    setEditModalOpen(true);
  };

  const handleSavePartEdit = async (newTitle: string, newSummary: string) => {
    if (!editingPart) return;
    
    const { id: partId, title: currentTitle, summary: currentSummary } = editingPart;
    
    // Only update if something changed
    if (newTitle !== currentTitle || newSummary !== currentSummary) {
      try {
        const updateData: any = {};
        if (newTitle !== currentTitle) updateData.title = newTitle;
        if (newSummary !== currentSummary) updateData.summary = newSummary;
        
        await updatePart(userId, bookId, partId, updateData);
        // Reload the book data
        const data = await getBookTOC(userId, bookId);
        setBookData(data);
      } catch (error) {
        console.error('Error updating part:', error);
        alert('Error updating part');
      }
    }
  };

  const handleDeletePart = async (partId: string, partTitle: string) => {
    if (confirm(`Are you sure you want to delete the part "${partTitle}"? This will also delete all its chapters and sections.`)) {
      try {
        await deletePart(userId, bookId, partId);
        // Reload the book data
        const data = await getBookTOC(userId, bookId);
        setBookData(data);
        alert('Part deleted successfully');
      } catch (error) {
        console.error('Error deleting part:', error);
        alert('Error deleting part');
      }
    }
  };

  const handleEditChapter = (chapterId: string, partId: string, title: string, summary: string) => {
    setEditingChapter({ id: chapterId, partId, title, summary });
    setChapterEditModalOpen(true);
  };

  const handleSaveChapter = async (title: string, summary: string) => {
    if (!editingChapter) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (title !== editingChapter.title) {
        updateData.title = title;
      }
      if (summary !== editingChapter.summary) {
        updateData.summary = summary;
      }

      if (Object.keys(updateData).length > 0) {
        await updateChapter(userId, bookId, editingChapter.partId, editingChapter.id, updateData);
        // Reload the book data
        const data = await getBookTOC(userId, bookId);
        setBookData(data);
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      alert('Error updating chapter');
      throw error;
    }
  };

  const handleDeleteChapter = async (chapterId: string, partId: string, chapterTitle: string) => {
    if (confirm(`Are you sure you want to delete the chapter "${chapterTitle}"? This will also delete all its sections.`)) {
      try {
        await deleteChapter(userId, bookId, partId, chapterId);
        // Reload the book data
        const data = await getBookTOC(userId, bookId);
        setBookData(data);
        alert('Chapter deleted successfully');
      } catch (error) {
        console.error('Error deleting chapter:', error);
        alert('Error deleting chapter');
      }
    }
  };

  // Load book data when component mounts
  useEffect(() => {
    const loadBookData = async () => {
      if (!userId || !bookId) return;
      
      try {
        setLoading(true);
        const data = await getBookTOC(userId, bookId);
        setBookData(data);
      } catch (error) {
        console.error('Error loading book data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookData();
  }, [userId, bookId]);

  if (loading) {
    return <div>Loading book...</div>;
  }

  if (!bookData?.parts?.length) {
    return (
      <div>
        <h3>Book has no content yet</h3>
        <p>This book exists but has no parts, chapters, or sections yet.</p>
        <button
          type="button"
          onClick={handleAddPart}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '15px'
          }}
        >
          + Add First Part
        </button>
      </div>
    );
  }

  const handleSaveContent = async (sectionId: string) => {
    setSaving(true);
    try {
      // In a real implementation, you'd find the section's path and update its blocks
      // For now, we'll simulate saving to blocks
      console.log('Saving content for section:', sectionId, content[sectionId]);
      
      // TODO: Replace with actual block creation/update logic
      // This would involve:
      // 1. Finding the section's part/chapter IDs
      // 2. Getting existing blocks for the section
      // 3. Updating or creating blocks with the new content
      
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content');
    } finally {
      setSaving(false);
    }
  };

  const handleAddChapter = async (partId: string) => {
    try {
      await createChapter(userId, bookId, partId, {
        title: 'New Chapter',
        summary: 'A new chapter in the part'
      });
      // Reload the book data to show the new chapter
      const data = await getBookTOC(userId, bookId);
      setBookData(data);
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Error creating chapter');
    }
  };

  const handleAddSection = async (chapterId: string) => {
    // We need to find the partId for this chapter
    const partData = bookData.parts.find((partData: any) => 
      partData.chapters.some((chapter: any) => chapter.id === chapterId)
    );
    
    if (!partData) {
      alert('Could not find part for this chapter');
      return;
    }

    try {
      await createSection(userId, bookId, partData.part.id, chapterId, {
        title: 'New Section',
        summary: 'A new section in the chapter'
      });
      // Reload the book data to show the new section
      const data = await getBookTOC(userId, bookId);
      setBookData(data);
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Error creating section');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Table of Contents */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '20px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2>{bookData.title}</h2>
          <button
            type="button"
            onClick={handleAddPart}
            style={{
              padding: '6px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + Part
          </button>
        </div>

        {bookData.parts.map((partData: any) => (
          <div key={partData.part.id} style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  {partData.part.title}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleEditPart(partData.part.id, partData.part.title, partData.part.summary)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    Edit
                  </button>
                <button
                  type="button"
                  onClick={() => handleDeletePart(partData.part.id, partData.part.title)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => handleAddChapter(partData.part.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  + Ch
                </button>
                </div>
              </div>
              {partData.part.summary && (
                <div style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  fontStyle: 'italic',
                  marginTop: '4px'
                }}>
                  {partData.part.summary}
                </div>
              )}
            </div>

            {partData.chapters.map((chapter: any) => (
              <div key={chapter.id} style={{ marginLeft: '15px', marginBottom: '12px' }}>
                <div style={{ 
                  fontWeight: '500', 
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div>{chapter.title}</div>
                    {chapter.summary && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        fontStyle: 'italic',
                        fontWeight: 'normal',
                        marginTop: '2px'
                      }}>
                        {chapter.summary}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleEditChapter(chapter.id, partData.part.id, chapter.title, chapter.summary || '')}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '9px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(chapter.id, partData.part.id, chapter.title)}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '9px'
                      }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection(chapter.id)}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '9px'
                      }}
                    >
                      + Sec
                    </button>
                  </div>
                </div>

                {chapter.sections?.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    style={{
                      marginLeft: '15px',
                      padding: '6px',
                      cursor: 'pointer',
                      backgroundColor: selectedSection === section.id ? '#e3f2fd' : 'transparent',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  >
                    {section.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Content Editor */}
      <div style={{ flex: 1, padding: '20px' }}>
        {selectedSection ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3>Editing Section Content</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Section ID: {selectedSection}
              </p>
            </div>

            <textarea
              value={content[selectedSection] || ''}
              onChange={(e) => setContent(prev => ({
                ...prev,
                [selectedSection]: e.target.value
              }))}
              style={{
                width: '100%',
                height: '400px',
                padding: '15px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
              placeholder="Enter section content here..."
            />

            <div style={{ marginTop: '15px' }}>
              <button
                type="button"
                onClick={() => handleSaveContent(selectedSection)}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: saving ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  marginRight: '10px'
                }}
              >
                {saving ? 'Saving...' : 'Save Content'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSection(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3>Select a section to edit</h3>
            <p>Choose a section from the table of contents to start editing its content.</p>
          </div>
        )}
      </div>

      {/* Part Edit Modal */}
      <PartEdit
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSavePartEdit}
        initialTitle={editingPart?.title || ''}
        initialSummary={editingPart?.summary || ''}
      />

      {/* Chapter Edit Modal */}
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