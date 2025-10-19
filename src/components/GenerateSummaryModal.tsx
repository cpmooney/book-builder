'use client';

import { useState } from 'react';
import { generateWithAI } from '../lib/ai';

interface GenerateSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  entityType: 'book' | 'part' | 'chapter' | 'section';
  entityTitle: string;
  onGenerated?: (content: string) => void;
}

export default function GenerateSummaryModal({
  isOpen,
  onClose,
  prompt,
  entityType,
  entityTitle,
  onGenerated
}: Readonly<GenerateSummaryModalProps>) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      const result = await generateWithAI({
        prompt,
        entityType,
        entityTitle
      });

      if (result.success && result.content) {
        setGeneratedContent(result.content);
      } else {
        setError(result.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGenerated = () => {
    if (generatedContent && onGenerated) {
      onGenerated(generatedContent);
    }
    onClose();
  };

  const handleClose = () => {
    setGeneratedContent('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

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
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '800px',
        maxHeight: '80vh',
        width: '90%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            color: '#333',
            fontWeight: 'bold'
          }}>
            Generate Summary for {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Entity Info */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '14px', 
            color: '#495057',
            marginBottom: '4px'
          }}>
            {entityType.charAt(0).toUpperCase() + entityType.slice(1)}: {entityTitle}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6c757d'
          }}>
            The following prompt will be sent to OpenAI:
          </div>
        </div>

        {/* Content Preview */}
        <div style={{
          flex: 1,
          minHeight: '200px',
          maxHeight: '400px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#333'
            }}>
              Complete OpenAI Prompt:
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(prompt);
                alert('Prompt copied to clipboard!');
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📋 Copy
            </button>
          </div>
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: 'monospace',
              lineHeight: '1.4',
              backgroundColor: '#f8f9fa',
              color: '#495057',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              userSelect: 'text',
              cursor: 'text'
            }}
          >
            {prompt || 'No prompt available'}
          </div>
        </div>

        {/* Generated Content */}
        {generatedContent && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '4px'
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              color: '#0066cc',
              fontWeight: 'bold'
            }}>
              🤖 Generated Content:
            </h4>
            <div style={{
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#333',
              whiteSpace: 'pre-wrap'
            }}>
              {generatedContent}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#ffe6e6',
            border: '1px solid #ff9999',
            borderRadius: '4px'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '14px', 
              color: '#cc0000',
              fontWeight: 'bold'
            }}>
              ❌ Error:
            </h4>
            <div style={{
              fontSize: '14px',
              color: '#cc0000'
            }}>
              {error}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '12px',
          borderTop: '1px solid #e0e0e0'
        }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
          
          {generatedContent ? (
            <button
              type="button"
              onClick={handleUseGenerated}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✅ Use This Content
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                padding: '10px 20px',
                backgroundColor: isGenerating ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isGenerating ? 0.7 : 1
              }}
            >
              {isGenerating ? '⏳ Generating...' : '🤖 Generate with AI'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}