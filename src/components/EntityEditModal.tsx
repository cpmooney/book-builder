'use client';

import { useState, useEffect } from 'react';
import GenerateSummaryModal from './GenerateSummaryModal';

export interface EntityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, summary: string) => void;
  initialTitle: string;
  initialSummary: string;
  entityType: 'book' | 'part' | 'chapter' | 'section';
  mode?: 'create' | 'edit';
  entityData?: any; // Data for generating AI prompts
}

// Configuration for different entity types
const ENTITY_CONFIG = {
  book: {
    label: 'Book',
    titleLabel: 'Book Title',
    summaryLabel: 'Book Summary'
  },
  part: {
    label: 'Part',
    titleLabel: 'Part Title', 
    summaryLabel: 'Part Summary'
  },
  chapter: {
    label: 'Chapter',
    titleLabel: 'Chapter Title',
    summaryLabel: 'Chapter Summary'
  },
  section: {
    label: 'Section',
    titleLabel: 'Section Title',
    summaryLabel: 'Section Summary'
  }
};

export default function EntityEditModal({
  isOpen,
  onClose,
  onSave,
  initialTitle,
  initialSummary,
  entityType,
  mode = 'edit',
  entityData
}: Readonly<EntityEditModalProps>) {
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [showGenerateSummaryModal, setShowGenerateSummaryModal] = useState(false);

  const handleSummaryGenerated = (content: string) => {
    setSummary(content);
    setShowGenerateSummaryModal(false);
  };

  const config = ENTITY_CONFIG[entityType];
  const isCreateMode = mode === 'create';

  const getPromptForAI = () => {
    if (!entityData) return '';
    
    const systemPrompt = `You are an expert writing assistant helping to generate concise, professional summaries. Please generate a summary of the following ${entityType} content in 2-3 clear, engaging sentences that capture the main themes and purpose.`;
    
    let content = '';
    
    // Use current form data
    const currentTitle = title || initialTitle;
    const currentSummary = summary || initialSummary;
    
    content = `Title: ${currentTitle || `Untitled ${config.label}`}\n\n`;
    
    if (currentSummary) {
      content += `Current Summary: ${currentSummary}\n\n`;
    }
    
    // Add any additional context from entityData if available
    if (entityData?.overview) {
      content += `Overview: ${entityData.overview}\n\n`;
    }
    
    // Add children information if available
    if (entityData?.parts?.length > 0) {
      content += 'Parts:\n';
      entityData.parts.forEach((partData: any, index: number) => {
        const part = partData.part;
        content += `${index + 1}. ${part.title || 'Untitled Part'}`;
        if (part.summary) {
          content += `\n   Summary: ${part.summary}`;
        }
        content += '\n\n';
      });
    } else if (entityData?.chapters?.length > 0) {
      content += 'Chapters:\n';
      entityData.chapters.forEach((chapter: any, index: number) => {
        content += `${index + 1}. ${chapter.title || 'Untitled Chapter'}`;
        if (chapter.summary) {
          content += `\n   Summary: ${chapter.summary}`;
        }
        content += '\n\n';
      });
    } else if (entityData?.sections?.length > 0) {
      content += 'Sections:\n';
      entityData.sections.forEach((section: any, index: number) => {
        content += `${String.fromCodePoint(65 + index)}. ${section.title || 'Untitled Section'}`;
        if (section.summary) {
          content += `\n   Summary: ${section.summary}`;
        }
        content += '\n\n';
      });
    }
    
    return `${systemPrompt}\n\n${content}`;
  };

  // Reset form when modal opens with new data
  useEffect(() => {
    setTitle(initialTitle);
    setSummary(initialSummary);
  }, [initialTitle, initialSummary]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim(), summary.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    setTitle(initialTitle);
    setSummary(initialSummary);
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
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          color: '#333',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          {isCreateMode ? `Create New ${config.label}` : `Edit ${config.label}`}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="title"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}
            >
              {config.titleLabel}:
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${config.titleLabel.toLowerCase()}`}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <label 
                htmlFor="summary"
                style={{
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '14px'
                }}
              >
                {config.summaryLabel}:
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
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={`Enter ${config.summaryLabel.toLowerCase()}`}
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f8f9fa',
                color: '#6c757d',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {isCreateMode ? `Create ${config.label}` : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Generate Summary Modal */}
      <GenerateSummaryModal
        isOpen={showGenerateSummaryModal}
        onClose={() => setShowGenerateSummaryModal(false)}
        prompt={getPromptForAI()}
        entityType={entityType}
        entityTitle={title || initialTitle || `Unknown ${config.label}`}
        onGenerated={handleSummaryGenerated}
      />
    </div>
  );
}