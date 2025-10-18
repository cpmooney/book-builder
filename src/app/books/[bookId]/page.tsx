'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBookTOC, createPart, updatePart, deletePart, reorderParts } from '../../../features/books/data';
import { useAuth } from '../../../components/AuthProvider';
import PartEdit from '../../../components/PartEdit';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortablePartItemProps {
  partData: any;
  bookId: string;
  onEdit: (id: string, title: string, summary: string) => void;
  onDelete: (id: string, title: string) => void;
}

function SortablePartItem({ partData, bookId, onEdit, onDelete }: SortablePartItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: partData.part.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#f9f9f9',
        cursor: 'grab'
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <Link 
            href={`/books/${bookId}/parts/${partData.part.id}`}
            style={{ 
              textDecoration: 'none', 
              color: '#007bff',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            {partData.part.title}
          </Link>
          {partData.part.summary && (
            <p style={{ 
              color: '#666', 
              fontSize: '14px', 
              marginTop: '8px',
              fontStyle: 'italic'
            }}>
              {partData.part.summary}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(partData.part.id, partData.part.title, partData.part.summary || '');
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              onDelete(partData.part.id, partData.part.title);
            }}
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
      <div>
        <strong>Chapters: </strong>
        {partData.chapters && partData.chapters.length > 0 ? (
          <span>{partData.chapters.length}</span>
        ) : (
          <span style={{ color: '#999' }}>No chapters yet</span>
        )}
      </div>
    </div>
  );
}

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<{
    id: string;
    title: string;
    summary: string;
  } | null>(null);

  const bookId = params.bookId as string;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const loadBookData = async () => {
      if (!user?.uid || !bookId) return;
      
      try {
        setLoading(true);
        const data = await getBookTOC(user.uid, bookId);
        setBookData(data);
      } catch (error) {
        console.error('Error loading book data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookData();
  }, [user?.uid, bookId]);

  const handleAddPart = async () => {
    if (!user?.uid) return;

    try {
      await createPart(user.uid, bookId, {
        title: 'New Part',
        summary: ''
      });
      // Reload the book data
      const data = await getBookTOC(user.uid, bookId);
      setBookData(data);
    } catch (error) {
      console.error('Error creating part:', error);
      alert('Error creating part');
    }
  };

  const handleEditPart = (partId: string, title: string, summary: string) => {
    setEditingPart({ id: partId, title, summary });
    setEditModalOpen(true);
  };

  const handleSavePartEdit = async (title: string, summary: string) => {
    if (!editingPart || !user?.uid) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (title !== editingPart.title) {
        updateData.title = title;
      }
      if (summary !== editingPart.summary) {
        updateData.summary = summary;
      }

      if (Object.keys(updateData).length > 0) {
        await updatePart(user.uid, bookId, editingPart.id, updateData);
        // Reload the book data
        const data = await getBookTOC(user.uid, bookId);
        setBookData(data);
      }
    } catch (error) {
      console.error('Error updating part:', error);
      alert('Error updating part');
      throw error;
    }
  };

  const handleDeletePart = async (partId: string, partTitle: string) => {
    if (!user?.uid) return;
    
    if (confirm(`Are you sure you want to delete the part "${partTitle}"? This will also delete all its chapters and sections.`)) {
      try {
        await deletePart(user.uid, bookId, partId);
        // Reload the book data
        const data = await getBookTOC(user.uid, bookId);
        setBookData(data);
        alert('Part deleted successfully');
      } catch (error) {
        console.error('Error deleting part:', error);
        alert('Error deleting part');
      }
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && bookData?.parts) {
      const oldIndex = bookData.parts.findIndex((partData: any) => partData.part.id === active.id);
      const newIndex = bookData.parts.findIndex((partData: any) => partData.part.id === over.id);

      const newParts = arrayMove(bookData.parts, oldIndex, newIndex);
      
      // Optimistically update UI
      setBookData({ ...bookData, parts: newParts });

      // Update sortKeys in Firestore
      try {
        const partIds = newParts.map((partData: any) => partData.part.id);
        await reorderParts(user!.uid, bookId, partIds);
      } catch (error) {
        console.error('Error reordering parts:', error);
        // Revert on error
        const data = await getBookTOC(user!.uid, bookId);
        setBookData(data);
        alert('Error reordering parts');
      }
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading book...</div>;
  }

  if (!bookData) {
    return <div style={{ padding: '20px' }}>Book not found</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/books" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Books
        </Link>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h1>{bookData.title}</h1>
        {bookData.description && (
          <p style={{ color: '#666', fontSize: '16px', marginTop: '10px' }}>
            {bookData.description}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleAddPart}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Add Part
        </button>
      </div>

      <div>
        <h2>Parts</h2>
        {bookData.parts && bookData.parts.length > 0 ? (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={bookData.parts.map((partData: any) => partData.part.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookData.parts.map((partData: any) => (
                  <SortablePartItem
                    key={partData.part.id}
                    partData={partData}
                    bookId={bookId}
                    onEdit={handleEditPart}
                    onDelete={handleDeletePart}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <p style={{ color: '#666' }}>No parts yet. Add your first part to get started.</p>
        )}
      </div>

      <PartEdit
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSavePartEdit}
        initialTitle={editingPart?.title || ''}
        initialSummary={editingPart?.summary || ''}
      />
    </div>
  );
}