'use client';

import { useState } from 'react';
import type { Note } from '../types/book-builder';

interface NotesListViewProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (noteId: string, noteTitle: string) => void;
  loading?: boolean;
}

export default function NotesListView({
  notes,
  onEdit,
  onDelete,
  loading = false
}: Readonly<NotesListViewProps>) {
  const [showArchived, setShowArchived] = useState(false);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading notes...</div>
      </div>
    );
  }

  const filteredNotes = notes.filter(note => showArchived || !note.archived);
  const activeNotes = filteredNotes.filter(note => !note.archived);
  const archivedNotes = notes.filter(note => note.archived);

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateValue: Date | { seconds: number; nanoseconds: number }) => {
    let date: Date;
    
    if ('seconds' in dateValue) {
      // Firestore timestamp
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = dateValue;
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (filteredNotes.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '2px dashed #dee2e6'
      }}>
        <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
          {showArchived ? 'No archived notes yet.' : 'No notes yet. Click "Add Note" to get started!'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Archive toggle */}
      <div style={{ 
        marginBottom: '16px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Notes ({activeNotes.length})
          {archivedNotes.length > 0 && (
            <span style={{ color: '#666', fontSize: '14px', fontWeight: 'normal' }}>
              {' '}• {archivedNotes.length} archived
            </span>
          )}
        </div>
        {archivedNotes.length > 0 && (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '14px',
            gap: '6px'
          }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />{' '}
            Show archived
          </label>
        )}
      </div>

      {/* Notes list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            style={{
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: note.archived ? '#f8f9fa' : 'white',
              opacity: note.archived ? 0.7 : 1,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h4 style={{
                  margin: '0 0 4px 0',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  wordBreak: 'break-word'
                }}>
                  {note.title}
                  {note.archived && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      Archived
                    </span>
                  )}
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '12px',
                  color: '#666',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    backgroundColor: getPriorityColor(note.priority),
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    textTransform: 'uppercase'
                  }}>
                    {note.priority}
                  </span>
                  <span>
                    {formatDate(note.createdAt)}
                  </span>
                  {note.updatedAt && (
                    <span>
                      Updated: {formatDate(note.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => onEdit(note)}
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
                  onClick={() => onDelete(note.id, note.title)}
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

            {/* Content */}
            <div style={{
              marginBottom: '12px',
              lineHeight: '1.5',
              color: '#333'
            }}>
              {note.content.length > 200 ? (
                <>
                  {note.content.substring(0, 200)}
                  <span style={{ color: '#666' }}>...</span>
                </>
              ) : (
                note.content
              )}
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                {note.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: '#e9ecef',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#495057'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}