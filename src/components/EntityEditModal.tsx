'use client';

import { useState, useEffect } from 'react';

export interface EntityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, summary: string) => void;
  initialTitle: string;
  initialSummary: string;
  entityType: 'book' | 'part' | 'chapter' | 'section';
  mode?: 'create' | 'edit';
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
  mode = 'edit'
}: Readonly<EntityEditModalProps>) {
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);

  const config = ENTITY_CONFIG[entityType];
  const isCreateMode = mode === 'create';

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
            <label 
              htmlFor="summary"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}
            >
              {config.summaryLabel}:
            </label>
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
    </div>
  );
}