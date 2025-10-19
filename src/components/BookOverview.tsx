/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';

interface BookOverviewProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly bookData: any;
}

export default function BookOverview({ isOpen, onClose, bookData }: BookOverviewProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !bookData) return null;

  // Helper function to convert number to Roman numerals
  const toRoman = (num: number): string => {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    
    let result = '';
    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += symbols[i];
        num -= values[i];
      }
    }
    return result;
  };

  // Function to generate text version of the overview
  const generateOverviewText = (): string => {
    const title = bookData?.title || 'Untitled Book';
    let text = `${title}\n`;
    text += '='.repeat(title.length) + '\n\n';
    
    if (bookData?.summary) {
      text += `${bookData.summary}\n\n`;
    }
    
    text += `Status: ${bookData?.status || 'Unknown'}\n`;
    text += `Parts: ${bookData?.parts?.length || 0}\n`;
    text += `Total Chapters: ${bookData?.parts?.reduce((total: number, partData: any) =>
      total + (partData.chapters?.length || 0), 0) || 0}\n\n`;
    
    if (bookData?.parts && bookData.parts.length > 0) {
      text += 'PARTS OVERVIEW\n';
      text += '-'.repeat(14) + '\n\n';
      
      for (const [index, partData] of bookData.parts.entries()) {
        text += `${toRoman(index + 1)}. ${partData.part.title}\n`;
        
        if (partData.part.summary) {
          text += `   ${partData.part.summary}\n`;
        }
        
        text += `   Chapters (${partData.chapters?.length || 0}):\n`;
        
        if (partData.chapters && partData.chapters.length > 0) {
          for (const [chapterIndex, chapter] of partData.chapters.entries()) {
            text += `   ${chapterIndex + 1}. ${chapter.title}\n`;
            if (chapter.summary) {
              text += `      ${chapter.summary}\n`;
            }
            text += `      Sections: ${chapter.sections?.length || 0}\n`;
          }
        } else {
          text += '   No chapters yet\n';
        }
        
        text += '\n';
      }
    } else {
      text += 'No parts have been created yet.\n';
    }
    
    return text;
  };

  // Function to copy overview to clipboard
  const handleCopyOverview = async () => {
    try {
      const overviewText = generateOverviewText();
      await navigator.clipboard.writeText(overviewText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generateOverviewText();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '2px solid #ddd',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
            Book Overview
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyOverview}
              style={{
                padding: '8px 12px',
                backgroundColor: copySuccess ? '#28a745' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
            >
              {copySuccess ? '✓ Copied!' : '📋 Copy Overview'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Book Summary */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '20px',
            color: '#444'
          }}>
            {bookData.title}
          </h3>
          {bookData.summary && (
            <p style={{ 
              color: '#666', 
              fontSize: '16px', 
              lineHeight: '1.5',
              margin: '0 0 16px 0'
            }}>
              {bookData.summary}
            </p>
          )}
          <div style={{ 
            fontSize: '14px', 
            color: '#999',
            display: 'flex',
            gap: '16px'
          }}>
            <span>Status: <strong style={{ textTransform: 'capitalize' }}>{bookData.status}</strong></span>
            <span>Parts: <strong>{bookData.parts?.length || 0}</strong></span>
            <span>Total Chapters: <strong>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {bookData.parts?.reduce((total: number, partData: any) => 
                total + (partData.chapters?.length || 0), 0) || 0}
            </strong></span>
          </div>
        </div>

        {/* Parts Overview */}
        <div>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '18px',
            color: '#444'
          }}>
            Parts Overview
          </h3>
          
          {bookData.parts && bookData.parts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {bookData.parts.map((partData: any, index: number) => (
                <div
                  key={partData.part.id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '16px',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <h4 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '16px',
                    color: '#333'
                  }}>
                    <span style={{ color: '#666', marginRight: '8px' }}>
                      {toRoman(index + 1)}.
                    </span>
                    {partData.part.title}
                  </h4>
                  
                  {partData.part.summary && (
                    <p style={{ 
                      color: '#666', 
                      fontSize: '14px', 
                      lineHeight: '1.4',
                      margin: '0 0 12px 0',
                      fontStyle: 'italic'
                    }}>
                      {partData.part.summary}
                    </p>
                  )}

                  {/* Chapters in this part */}
                  <div>
                    <strong style={{ fontSize: '14px', color: '#555' }}>
                      Chapters ({partData.chapters?.length || 0}):
                    </strong>
                    {partData.chapters && partData.chapters.length > 0 ? (
                      <ul style={{ 
                        margin: '8px 0 0 0', 
                        paddingLeft: '20px',
                        fontSize: '14px'
                      }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(partData.chapters as any[])?.map((chapter: any, chapterIndex: number) => (
                          <li key={chapter.id} style={{ marginBottom: '6px' }}>
                            <strong>{chapterIndex + 1}. {chapter.title}</strong>
                            {chapter.summary && (
                              <div style={{ 
                                color: '#666', 
                                fontStyle: 'italic',
                                marginTop: '2px'
                              }}>
                                {chapter.summary}
                              </div>
                            )}
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#999',
                              marginTop: '2px'
                            }}>
                              Sections: {chapter.sections?.length || 0}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ 
                        color: '#999', 
                        fontSize: '14px',
                        marginTop: '4px'
                      }}>
                        No chapters yet
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No parts have been created yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}