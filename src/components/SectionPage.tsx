'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import GenerateSummaryModal from './GenerateSummaryModal';
import { 
  getSectionContent,
  updateSection
} from '../features/books/data';
import type { Section } from '../types/book-builder';

interface SectionPageProps {
  bookId: string;
  partId: string;
  chapterId: string;
  sectionId: string;
}

export default function SectionPage({ 
  bookId, 
  partId, 
  chapterId, 
  sectionId 
}: Readonly<SectionPageProps>) {
  const { user } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isContentOnlyEditing, setIsContentOnlyEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showGenerateSummaryModal, setShowGenerateSummaryModal] = useState(false);

  useEffect(() => {
    const loadSection = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const sectionData = await getSectionContent(user.uid, bookId, partId, chapterId, sectionId);
        
        if (sectionData) {
          setSection(sectionData.section);
          setEditTitle(sectionData.section.title);
          setEditSummary(sectionData.section.summary || '');
          setEditContent(sectionData.section.content || sectionData.contentText || '');
        }
      } catch (error) {
        console.error('Error loading section:', error);
        alert('Error loading section');
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      router.push('/sign-in');
      return;
    }

    loadSection();
  }, [user, router, bookId, partId, chapterId, sectionId]);

  const handleSave = async () => {
    if (!user || !section) return;
    
    try {
      setIsSaving(true);
      
      await updateSection(user.uid, bookId, partId, chapterId, sectionId, {
        title: editTitle,
        summary: editSummary,
        content: editContent
      });
      
      // Update local state
      setSection({
        ...section,
        title: editTitle,
        summary: editSummary,
        content: editContent
      });
      
      setIsEditing(false);
      alert('Section saved successfully!');
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Error saving section');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentOnlySave = async () => {
    if (!user || !section) return;
    
    try {
      setIsSaving(true);
      
      await updateSection(user.uid, bookId, partId, chapterId, sectionId, {
        title: section.title, // Keep existing title
        summary: section.summary, // Keep existing summary
        content: editContent
      });
      
      // Update local state
      setSection({
        ...section,
        content: editContent
      });
      
      setIsContentOnlyEditing(false);
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!section) return;
    
    setEditTitle(section.title);
    setEditSummary(section.summary || '');
    setEditContent(section.content || '');
    setIsEditing(false);
  };

  const handleContentOnlyCancel = () => {
    if (!section) return;
    
    setEditContent(section.content || '');
    setIsContentOnlyEditing(false);
  };

  const handleContentClick = () => {
    if (!isEditing) { // Only allow content-only editing when not in full edit mode
      setEditContent(section?.content || '');
      setIsContentOnlyEditing(true);
    }
  };

  const goBack = () => {
    router.push(`/books/${bookId}/parts/${partId}/chapters/${chapterId}`);
  };

  const getPromptForAI = () => {
    if (!section) return '';
    
    const systemPrompt = `You are an expert writing assistant helping to generate concise, professional summaries. Please generate a summary of the following section content in 2-3 clear, engaging sentences that capture the main themes and key points.`;
    
    let content = `Title: ${section.title}\n\n`;
    
    if (section.summary) {
      content += `Current Summary: ${section.summary}\n\n`;
    }
    
    if (section.content) {
      content += `Content:\n${section.content}`;
    } else {
      content += 'No content available.';
    }
    
    return `${systemPrompt}\n\n${content}`;
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!section) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Section Not Found</h1>
        <button onClick={goBack}>← Back to Chapter</button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#007bff',
            marginRight: '15px'
          }}
        >
          ← Back to Chapter
        </button>
        
        {!isEditing && !isContentOnlyEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✏️ Edit Section
          </button>
        ) : isContentOnlyEditing ? (
          <div style={{ 
            padding: '8px 16px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #007bff',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#007bff'
          }}>
            💬 Content editing mode (click content area for controls)
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? 'Saving...' : '✓ Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div>
          {/* Title Edit */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '14px' 
            }}>
              Section Title:
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                fontFamily: 'inherit'
              }}
              placeholder="Enter section title"
            />
          </div>

          {/* Summary Edit */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <label style={{ 
                fontWeight: 'bold',
                fontSize: '14px' 
              }}>
                Section Summary:
              </label>
              <button
                type="button"
                onClick={() => setShowGenerateSummaryModal(true)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🤖 Generate with AI
              </button>
            </div>
            <textarea
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="Brief summary of this section (displayed in chapter view)"
            />
          </div>

          {/* Content Edit */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '14px' 
            }}>
              Section Content:
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={20}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                lineHeight: '1.5',
                resize: 'vertical'
              }}
              placeholder="Enter section content..."
            />
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '5px' 
            }}>
              Tip: Line breaks and spacing will be preserved in the display
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Title Display */}
          <h1 style={{ 
            fontSize: '32px', 
            marginBottom: '20px',
            color: '#333'
          }}>
            {section.title}
          </h1>

          {/* Summary Display */}
          {section.summary && (
            <div style={{
              backgroundColor: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '4px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                margin: '0 0 10px 0', 
                fontSize: '16px', 
                color: '#0066cc',
                fontWeight: 'bold'
              }}>
                Summary
              </h3>
              <div style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#333'
              }}>
                {section.summary}
              </div>
            </div>
          )}

          {/* Content Display/Edit */}
          {isContentOnlyEditing ? (
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '2px solid #007bff',
              borderRadius: '4px',
              padding: '15px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  color: '#007bff' 
                }}>
                  Editing Content
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleContentOnlySave}
                    disabled={isSaving}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      opacity: isSaving ? 0.7 : 1
                    }}
                  >
                    {isSaving ? 'Saving...' : '✓ Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleContentOnlyCancel}
                    disabled={isSaving}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={20}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
                placeholder="Enter section content..."
                autoFocus
              />
            </div>
          ) : (
            <div 
              onClick={handleContentClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleContentClick();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Click to edit content"
              style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '20px',
                minHeight: '300px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                whiteSpace: 'pre-wrap',
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#333'
              }}>
                {section.content || 'No content yet. Click here to add content.'}
              </div>
              {/* Hover tooltip */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                color: '#007bff',
                padding: '4px 8px',
                borderRadius: '3px',
                fontSize: '12px',
                pointerEvents: 'none'
              }}>
                💬 Click to edit content
              </div>
            </div>
          )}
          
          {/* Section Info */}
          <div style={{ 
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            <div>Section ID: {section.id}</div>
            {section.summary && (
              <div>
                Summary word count: {section.summary.split(/\s+/).filter(word => word.length > 0).length}
              </div>
            )}
            {section.content && (
              <div>
                Content word count: {section.content.split(/\s+/).filter(word => word.length > 0).length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Summary Modal */}
      <GenerateSummaryModal
        isOpen={showGenerateSummaryModal}
        onClose={() => setShowGenerateSummaryModal(false)}
        prompt={getPromptForAI()}
        entityType="section"
        entityTitle={section?.title || 'Unknown Section'}
      />
    </div>
  );
}