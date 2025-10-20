'use client';

import { useState } from 'react';

interface BookOverviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly bookData: any;
}

export default function BookOverviewModal({ 
  isOpen, 
  onClose, 
  bookData 
}: BookOverviewModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !bookData) return null;

  // Generate TOC text with summaries
  const generateTOC = () => {
    let toc = `${bookData.title || 'Untitled Book'}\n`;
    toc += `${bookData.summary || 'No summary available'}\n\n`;

    if (bookData.parts && bookData.parts.length > 0) {
      bookData.parts.forEach((partData: any, partIndex: number) => {
        const part = partData.part;
        toc += `Part ${partIndex + 1}: ${part.title || 'Untitled Part'}\n`;
        if (part.summary) {
          toc += `${part.summary}\n`;
        }
        toc += '\n';

        if (partData.chapters && partData.chapters.length > 0) {
          partData.chapters.forEach((chapter: any, chapterIndex: number) => {
            toc += `  Chapter ${chapterIndex + 1}: ${chapter.title || 'Untitled Chapter'}\n`;
            if (chapter.summary) {
              toc += `  ${chapter.summary}\n`;
            }
            toc += '\n';
          });
        }
      });
    }

    return toc.trim();
  };

  const handleCopy = async () => {
    try {
      const tocText = generateTOC();
      await navigator.clipboard.writeText(tocText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy TOC:', err);
    }
  };

  const tocText = generateTOC();

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '16px'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#333',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            📖 Book Overview
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '8px 16px',
                backgroundColor: copySuccess ? '#28a745' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
            >
              {copySuccess ? '✅ Copied!' : '📋 Copy TOC'}
            </button>
            <button
              type="button"
              onClick={onClose}
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
              ✕ Close
            </button>
          </div>
        </div>

        {/* Book Title and Summary */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: '#333',
            fontSize: '20px'
          }}>
            {bookData.title || 'Untitled Book'}
          </h3>
          {bookData.summary && (
            <p style={{ 
              margin: '0', 
              color: '#666',
              fontSize: '16px',
              fontStyle: 'italic',
              lineHeight: '1.5'
            }}>
              {bookData.summary}
            </p>
          )}
        </div>

        {/* TOC Content */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '16px',
          fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          {tocText || 'No content available'}
        </div>

        {/* Stats */}
        <div style={{ 
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666'
        }}>
          <strong>Structure:</strong> {bookData.parts?.length || 0} parts, {' '}
          {bookData.parts?.reduce((total: number, part: any) => 
            total + (part.chapters?.length || 0), 0) || 0} chapters
        </div>
      </div>
    </div>
  );
}