'use client';

import { useState, useEffect } from 'react';
import type { Note } from '../types/book-builder';

interface NoteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NoteFormData) => Promise<void>;
  note?: Note | null;
  entityType: 'book' | 'part' | 'chapter' | 'section';
  entityTitle: string;
}

export interface NoteFormData {
  title: string;
  content: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  archived: boolean;
}

export default function NoteEditModal({
  isOpen,
  onClose,
  onSave,
  note,
  entityType,
  entityTitle
}: Readonly<NoteEditModalProps>) {
  const [formData, setFormData] = useState<NoteFormData>({
    title: '',
    content: '',
    tags: [],
    priority: 'medium',
    archived: false
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (note) {
        setFormData({
          title: note.title,
          content: note.content,
          tags: note.tags || [],
          priority: note.priority,
          archived: note.archived
        });
      } else {
        setFormData({
          title: '',
          content: '',
          tags: [],
          priority: 'medium',
          archived: false
        });
      }
      setTagInput('');
    }
  }, [isOpen, note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };



  if (!isOpen) return null;

  const isEditing = !!note;

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
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
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
            {isEditing ? 'Edit Note' : 'Create New Note'}
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

        {/* Context Info */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#495057'
        }}>
          <strong>Adding note to:</strong> {entityType.charAt(0).toUpperCase() + entityType.slice(1)} - {entityTitle}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="note-title"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#333'
              }}
            >
              Title *
            </label>
            <input
              id="note-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter note title..."
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Content */}
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="note-content"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#333'
              }}
            >
              Content *
            </label>
            <textarea
              id="note-content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter note content..."
              required
              rows={6}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Priority */}
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="note-priority"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#333'
              }}
            >
              Priority
            </label>
            <select
              id="note-priority"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="note-tags"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#333'
              }}
            >
              Tags
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                id="note-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag..."
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <button
                type="button"
                onClick={addTag}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: '#e9ecef',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#666',
                        padding: '0',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Archived checkbox */}
          {isEditing && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={formData.archived}
                  onChange={(e) => setFormData(prev => ({ ...prev, archived: e.target.checked }))}
                />{' '}
                Archive this note
              </label>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: loading || !formData.title.trim() || !formData.content.trim() ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !formData.title.trim() || !formData.content.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
{(() => {
                if (loading) return 'Saving...';
                return isEditing ? 'Update Note' : 'Create Note';
              })()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}