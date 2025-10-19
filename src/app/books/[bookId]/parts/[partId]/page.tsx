'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPartTOC, createChapter, updatePart, reorderChapters, deleteChapter } from '../../../../../features/books/data';
import { useAuth } from '../../../../../components/AuthProvider';
import PartEdit from '../../../../../components/PartEdit';
import EntityListView, { 
  type BreadcrumbItem, 
  type EntityListViewConfig, 
  type ChildData,
  type EntityData
} from '../../../../../components/EntityListView';

export default function PartPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [partData, setPartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const bookId = params.bookId as string;
  const partId = params.partId as string;

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const loadPartData = async () => {
      if (!user?.uid || !bookId || !partId) return;
      
      try {
        setLoading(true);
        const data = await getPartTOC(user.uid, bookId, partId);
        setPartData(data);
      } catch (error) {
        console.error('Error loading part data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPartData();
  }, [user?.uid, bookId, partId]);

  const handleAddChapter = async () => {
    if (!user?.uid) return;

    try {
      await createChapter(user.uid, bookId, partId, {
        title: 'New Chapter',
        summary: ''
      });
      // Reload the part data
      const data = await getPartTOC(user.uid, bookId, partId);
      setPartData(data);
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Error creating chapter');
    }
  };

  const handleEditPart = () => {
    setEditModalOpen(true);
  };

  const handleSavePartEdit = async (title: string, summary: string) => {
    if (!partData || !user?.uid) return;

    try {
      await updatePart(user.uid, bookId, partId, { title, summary });
      // Reload the part data
      const data = await getPartTOC(user.uid, bookId, partId);
      setPartData(data);
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating part:', error);
      alert('Error updating part');
    }
  };

  const handleDeleteChapter = async (chapterId: string, title: string) => {
    if (!user?.uid) return;
    
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all sections within this chapter.`)) {
      return;
    }

    try {
      await deleteChapter(user.uid, bookId, partId, chapterId);
      // Reload the part data
      const data = await getPartTOC(user.uid, bookId, partId);
      setPartData(data);
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('Error deleting chapter');
    }
  };

  const handleReorderChapters = async (activeId: string, overId: string) => {
    if (!user?.uid || !partData?.chapters) return;
    
    try {
      // Find the current order and create new order
      const currentChapters = partData.chapters.map((c: any) => c.id);
      const activeIndex = currentChapters.indexOf(activeId);
      const overIndex = currentChapters.indexOf(overId);
      
      // Create new order array
      const newOrder = [...currentChapters];
      newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, activeId);
      
      await reorderChapters(user.uid, bookId, partId, newOrder);
      // Reload the part data
      const data = await getPartTOC(user.uid, bookId, partId);
      setPartData(data);
    } catch (error) {
      console.error('Error reordering chapters:', error);
      throw error; // Re-throw to trigger optimistic rollback
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (!partData) {
    return <EntityListView
      entityData={{ id: '', title: '', summary: '' }}
      items={[]}
      config={{
        entityType: 'part',
        childType: 'chapter',
        entityLabel: 'Part',
        childLabel: 'Chapter',
        childLabelPlural: 'Chapters',
        showRomanNumerals: false,
        showOverview: false
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

  // Transform part data for EntityListView
  const entityData: EntityData = {
    id: partData.part.id,
    title: partData.part.title,
    summary: partData.part.summary
  };

  const children: ChildData[] = partData.chapters?.map((chapter: any) => ({
    id: chapter.id,
    title: chapter.title,
    summary: chapter.summary,
    sections: [] // TODO: Load sections if needed
  })) || [];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Books', href: '/' },
    { label: 'Book', href: `/books/${bookId}` }, // TODO: Get actual book title
    { label: partData.part.title }
  ];

  const config: EntityListViewConfig = {
    entityType: 'part',
    childType: 'chapter',
    entityLabel: 'Part',
    childLabel: 'Chapter',
    childLabelPlural: 'Chapters',
    showRomanNumerals: false,
    showOverview: false
  };

  const getChildPath = (child: ChildData) => `/books/${bookId}/parts/${partId}/chapters/${child.id}`;
  const getChildCount = (child: ChildData) => (child.sections as unknown[])?.length || 0;

  const editPartButton = (
    <button
      type="button"
      onClick={handleEditPart}
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
      ✏️ Edit Part
    </button>
  );

  return (
    <>
      <EntityListView
        entityData={entityData}
        items={children}
        config={config}
        breadcrumbs={breadcrumbs}
        loading={loading}
        onEdit={(id, title, summary) => {
          // For chapters, we'll handle editing differently
          alert('Chapter editing not yet implemented');
        }}
        onDelete={handleDeleteChapter}
        onCreate={handleAddChapter}
        onReorder={handleReorderChapters}
        getChildPath={getChildPath}
        getChildCount={getChildCount}
        extraActions={editPartButton}
      />

      <PartEdit
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSavePartEdit}
        initialTitle={partData?.part?.title || ''}
        initialSummary={partData?.part?.summary || ''}
      />
    </>
  );
}