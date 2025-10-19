'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBookTOC, createPart, updatePart, deletePart, reorderParts } from '../../../features/books/data';
import { useAuth } from '../../../components/AuthProvider';
import PartEdit from '../../../components/PartEdit';
import BookOverview from '../../../components/BookOverview';
import EntityListView, { 
  type BreadcrumbItem, 
  type EntityListViewConfig, 
  type ChildData,
  type EntityData
} from '../../../components/EntityListView';

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
  const [overviewModalOpen, setOverviewModalOpen] = useState(false);

  const bookId = params.bookId as string;

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
      await updatePart(user.uid, bookId, editingPart.id, { title, summary });
      // Reload the book data
      const data = await getBookTOC(user.uid, bookId);
      setBookData(data);
      setEditModalOpen(false);
      setEditingPart(null);
    } catch (error) {
      console.error('Error updating part:', error);
      alert('Error updating part');
    }
  };

  const handleDeletePart = async (partId: string, title: string) => {
    if (!user?.uid) return;
    
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all chapters and sections within this part.`)) {
      return;
    }

    try {
      await deletePart(user.uid, bookId, partId);
      // Reload the book data
      const data = await getBookTOC(user.uid, bookId);
      setBookData(data);
    } catch (error) {
      console.error('Error deleting part:', error);
      alert('Error deleting part');
    }
  };

  const handleReorderParts = async (activeId: string, overId: string) => {
    if (!user?.uid || !bookData?.parts) return;
    
    try {
      // Find the current order and create new order
      const currentParts = bookData.parts.map((p: { part: { id: string } }) => p.part.id);
      const activeIndex = currentParts.indexOf(activeId);
      const overIndex = currentParts.indexOf(overId);
      
      // Create new order array
      const newOrder = [...currentParts];
      newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, activeId);
      
      await reorderParts(user.uid, bookId, newOrder);
      // Reload the book data
      const data = await getBookTOC(user.uid, bookId);
      setBookData(data);
    } catch (error) {
      console.error('Error reordering parts:', error);
      throw error; // Re-throw to trigger optimistic rollback
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (!bookData) {
    return <EntityListView
      entityData={{ id: '', title: '', summary: '' }}
      items={[]}
      config={{
        entityType: 'book',
        childType: 'part',
        entityLabel: 'Book',
        childLabel: 'Part',
        childLabelPlural: 'Parts',
        showRomanNumerals: true,
        showOverview: true
      }}
      breadcrumbs={[]}
      loading={true}
      onEdit={() => {}}
      onDelete={() => {}}
      onCreate={async () => {}}
      onReorder={async () => {}}
      getChildPath={() => ''}
    />;
  }

  // Transform book data for EntityListView
  const entityData: EntityData = {
    id: bookData.id,
    title: bookData.title,
    summary: bookData.summary
  };

  const children: ChildData[] = bookData.parts?.map((partData: { part: { id: string; title: string; summary?: string }; chapters?: unknown[] }) => ({
    id: partData.part.id,
    title: partData.part.title,
    summary: partData.part.summary,
    chapters: partData.chapters
  })) || [];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Books', href: '/' },
    { label: bookData.title }
  ];

  const config: EntityListViewConfig = {
    entityType: 'book',
    childType: 'part',
    entityLabel: 'Book',
    childLabel: 'Part',
    childLabelPlural: 'Parts',
    showRomanNumerals: true,
    showOverview: true
  };

  const getChildPath = (child: ChildData) => `/books/${bookId}/parts/${child.id}`;
  const getChildCount = (child: ChildData) => (child.chapters as unknown[])?.length || 0;

  return (
    <>
      <EntityListView
        entityData={entityData}
        items={children}
        config={config}
        breadcrumbs={breadcrumbs}
        loading={loading}
        onEdit={handleEditPart}
        onDelete={handleDeletePart}
        onCreate={handleAddPart}
        onReorder={handleReorderParts}
        onShowOverview={() => setOverviewModalOpen(true)}
        getChildPath={getChildPath}
        getChildCount={getChildCount}
      />

      <PartEdit
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSavePartEdit}
        initialTitle={editingPart?.title || ''}
        initialSummary={editingPart?.summary || ''}
      />

      <BookOverview
        isOpen={overviewModalOpen}
        onClose={() => setOverviewModalOpen(false)}
        bookData={bookData}
      />
    </>
  );
}