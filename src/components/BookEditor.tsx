'use client';

import { useState } from 'react';
import { 
  createPart, 
  createChapter, 
  createSection, 
  createBlock, 
  updateBlock 
} from '../features/books/data';

interface BookEditorProps {
  userId: string;
  bookId: string;
}

// Mock data for demonstration
const mockBookData = {
  book1: {
    title: 'My First Book',
    parts: [
      {
        id: 'part1',
        title: 'Introduction',
        chapters: [
          {
            id: 'chapter1',
            title: 'Getting Started',
            sections: [
              { id: 'section1', title: 'Overview' },
              { id: 'section2', title: 'Setup' }
            ]
          }
        ]
      },
      {
        id: 'part2',
        title: 'Main Content',
        chapters: [
          {
            id: 'chapter2',
            title: 'Core Concepts',
            sections: [
              { id: 'section3', title: 'Fundamentals' }
            ]
          }
        ]
      }
    ]
  }
};

const mockSectionContent = {
  section1: 'This is the overview section content. You can edit this text.',
  section2: 'Setup instructions go here. This is editable content.',
  section3: 'Core concepts and fundamentals are explained here.'
};

export default function BookEditor({ userId, bookId }: Readonly<BookEditorProps>) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, string>>(mockSectionContent);
  const [saving, setSaving] = useState(false);

  const bookData = mockBookData[bookId as keyof typeof mockBookData];

  if (!bookData) {
    return <div>Book not found</div>;
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
      
      alert('Content saved! (This is a simulation - implement actual Firestore saving)');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPart = async () => {
    try {
      const partRef = await createPart(userId, bookId, {
        title: 'New Part',
        summary: 'A new part in the book'
      });
      console.log('Created part:', partRef.id);
      // TODO: Refresh the book data to show the new part
      alert('Part created! Refresh to see changes.');
    } catch (error) {
      console.error('Error creating part:', error);
      alert('Error creating part');
    }
  };

  const handleAddChapter = async (partId: string) => {
    try {
      const chapterRef = await createChapter(userId, bookId, partId, {
        title: 'New Chapter',
        summary: 'A new chapter in the part'
      });
      console.log('Created chapter:', chapterRef.id);
      // TODO: Refresh the book data to show the new chapter
      alert('Chapter created! Refresh to see changes.');
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Error creating chapter');
    }
  };

  const handleAddSection = async (chapterId: string) => {
    // We need to find the partId for this chapter
    const partId = bookData.parts.find(part => 
      part.chapters.some(chapter => chapter.id === chapterId)
    )?.id;
    
    if (!partId) {
      alert('Could not find part for this chapter');
      return;
    }

    try {
      const sectionRef = await createSection(userId, bookId, partId, chapterId, {
        title: 'New Section',
        summary: 'A new section in the chapter'
      });
      console.log('Created section:', sectionRef.id);
      // TODO: Refresh the book data to show the new section
      alert('Section created! Refresh to see changes.');
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

        {bookData.parts.map((part) => (
          <div key={part.id} style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '16px', 
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {part.title}
              <button
                type="button"
                onClick={() => handleAddChapter(part.id)}
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

            {part.chapters.map((chapter) => (
              <div key={chapter.id} style={{ marginLeft: '15px', marginBottom: '12px' }}>
                <div style={{ 
                  fontWeight: '500', 
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {chapter.title}
                  <button
                    type="button"
                    onClick={() => handleAddSection(chapter.id)}
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
                    + Sec
                  </button>
                </div>

                {chapter.sections.map((section) => (
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
    </div>
  );
}