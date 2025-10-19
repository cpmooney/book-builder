'use client';

import { useState, useEffect } from 'react';

interface MoveEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetParentId: string) => void;
  entityType: 'part' | 'chapter' | 'section';
  entityTitle: string;
  currentParentId: string;
  availableParents: { id: string; title: string; }[];
}

export default function MoveEntityModal({
  isOpen,
  onClose,
  onMove,
  entityType,
  entityTitle,
  currentParentId,
  availableParents
}: Readonly<MoveEntityModalProps>) {
  const [selectedParentId, setSelectedParentId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedParentId('');
    }
  }, [isOpen]);

  const handleMove = () => {
    if (selectedParentId && selectedParentId !== currentParentId) {
      onMove(selectedParentId);
      onClose();
    }
  };

  if (!isOpen) return null;

  const getParentLabel = () => {
    switch (entityType) {
      case 'part':
        return 'book';
      case 'chapter':
        return 'part';
      case 'section':
        return 'chapter';
      default:
        return 'parent';
    }
  };

  const filteredParents = availableParents.filter(parent => parent.id !== currentParentId);

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
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
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
            Move {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
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
            Moving: {entityTitle}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6c757d'
          }}>
            Select a new {getParentLabel()} to move this {entityType} to:
          </div>
        </div>

        {/* Parent Selection */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#333'
          }}>
            Select Destination {getParentLabel().charAt(0).toUpperCase() + getParentLabel().slice(1)}:
          </div>
          
          {filteredParents.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              No other {getParentLabel()}s available to move to.
            </div>
          ) : (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {filteredParents.map((parent, index) => (
                <label
                  key={parent.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    borderBottom: index === filteredParents.length - 1 ? 'none' : '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedParentId === parent.id ? '#e7f3ff' : 'white',
                    fontSize: '14px'
                  }}
                >
                  <input
                    type="radio"
                    name="parentSelection"
                    value={parent.id}
                    checked={selectedParentId === parent.id}
                    onChange={() => setSelectedParentId(parent.id)}
                    style={{ marginRight: '8px' }}
                  />
                  {parent.title}
                </label>
              ))}
            </div>
          )}
        </div>

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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={!selectedParentId || selectedParentId === currentParentId || filteredParents.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedParentId && selectedParentId !== currentParentId ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedParentId && selectedParentId !== currentParentId ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            Move {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </button>
        </div>
      </div>
    </div>
  );
}