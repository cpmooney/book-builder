/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import EntityListView, { 
  type BreadcrumbItem, 
  type EntityListViewConfig, 
  type ChildData,
  type EntityData
} from './EntityListView';

// Import data functions
import { 
  getBookTOC, 
  getPartTOC,
  getSectionContent,
  listSections,
  createPart, 
  createChapter, 
  createSection,
  updateBook,
  updatePart, 
  updateChapter,
  deletePart, 
  deleteChapter, 
  deleteSection,
  reorderParts, 
  reorderChapters,
  reorderSections
} from '../features/books/data';

// Import edit components
import EntityEditModal from './EntityEditModal';
import EntityOverview from './EntityOverview';

export interface HierarchicalEntityConfig {
  level: 'book' | 'part' | 'chapter' | 'section';
  entityId: string;
  parentIds: {
    bookId?: string;
    partId?: string;
    chapterId?: string;
    sectionId?: string;
  };
}

interface HierarchicalEntityPageProps {
  config: HierarchicalEntityConfig;
}

// Configuration for each entity level
const LEVEL_CONFIGS: Record<string, {
  entityLabel: string;
  childLabel: string;
  childLabelPlural: string;
  numberStyle: 'roman' | 'numeric' | 'alpha' | 'bullet';
  childType: 'part' | 'chapter' | 'section';
}> = {
  book: {
    entityLabel: 'Book',
    childLabel: 'Part',
    childLabelPlural: 'Parts',
    numberStyle: 'roman', // Parts use Roman numerals (I, II, III)
    childType: 'part'
  },
  part: {
    entityLabel: 'Part',
    childLabel: 'Chapter',
    childLabelPlural: 'Chapters',
    numberStyle: 'numeric', // Chapters use numbers (1, 2, 3)
    childType: 'chapter'
  },
  chapter: {
    entityLabel: 'Chapter',
    childLabel: 'Section',
    childLabelPlural: 'Sections',
    numberStyle: 'alpha', // Sections use letters (A, B, C)
    childType: 'section'
  }
};

export default function HierarchicalEntityPage({ config }: Readonly<HierarchicalEntityPageProps>) {
  const router = useRouter();
  const { user } = useAuth();
  const [entityData, setEntityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createChildModalOpen, setCreateChildModalOpen] = useState(false);
  const [overviewModalOpen, setOverviewModalOpen] = useState(false);

  const { level, entityId, parentIds } = config;
  const levelConfig = LEVEL_CONFIGS[level];

  console.log('HierarchicalEntityPage - level:', level, 'levelConfig:', levelConfig);

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        let data: any;

        switch (level) {
          case 'book':
            data = await getBookTOC(user.uid, entityId);
            setEntityData(data);
            break;
            
          case 'part':
            if (!parentIds.bookId) throw new Error('Book ID required for part');
            data = await getPartTOC(user.uid, parentIds.bookId, entityId);
            setEntityData(data);
            break;
            
          case 'chapter': {
            if (!parentIds.bookId || !parentIds.partId) {
              throw new Error('Book ID and Part ID required for chapter');
            }
            // Get chapter data from book TOC
            const bookData = await getBookTOC(user.uid, parentIds.bookId);
            const partData = bookData.parts?.find((p: { part: { id: string } }) => p.part.id === parentIds.partId);
            const chapterData = partData?.chapters?.find((c: { id: string }) => c.id === entityId);
            
            if (!chapterData) throw new Error('Chapter not found');
            
            // Load sections for this chapter
            const sections = await listSections(user.uid, parentIds.bookId, parentIds.partId, entityId);
            
            setEntityData({
              chapter: chapterData,
              sections: sections
            });
            break;
          }

          case 'section': {
            if (!parentIds.bookId || !parentIds.partId || !parentIds.chapterId) {
              throw new Error('Book ID, Part ID, and Chapter ID required for section');
            }
            // Use getSectionContent to get the section data
            const sectionData = await getSectionContent(user.uid, parentIds.bookId, parentIds.partId, parentIds.chapterId, entityId);
            
            if (!sectionData) throw new Error('Section not found');
            
            setEntityData({
              section: sectionData,
              // Sections don't have children in our current structure
            });
            break;
          }
            
          default:
            throw new Error(`Unsupported level: ${level}`);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid, level, entityId, parentIds]);

  // Generic create child function
  const handleCreateChild = async () => {
    console.log('handleCreateChild called for level:', level);
    setCreateChildModalOpen(true);
  };

  // Handle saving new child from modal
  const handleSaveNewChild = async (title: string, summary: string) => {
    if (!user?.uid) return;

    try {
      console.log('Creating child:', { level, title, summary, parentIds });
      
      // For all levels, use summary field (sections have both summary and content)
      const childData = { title, summary };

      switch (level) {
        case 'book':
          console.log('Creating part for book:', entityId);
          await createPart(user.uid, entityId, childData);
          break;
        case 'part':
          if (!parentIds.bookId) return;
          console.log('Creating chapter for part:', entityId, 'in book:', parentIds.bookId);
          await createChapter(user.uid, parentIds.bookId, entityId, childData);
          break;
        case 'chapter':
          if (!parentIds.bookId || !parentIds.partId) return;
          console.log('Creating section for chapter:', entityId, 'in part:', parentIds.partId, 'in book:', parentIds.bookId);
          await createSection(user.uid, parentIds.bookId, parentIds.partId, entityId, childData);
          break;
        default:
          console.log('Create not implemented for', level);
          return;
      }

      // Reload data
      console.log('Reloading data after creation...');
      const loadData = async () => {
        let data: unknown;
        switch (level) {
          case 'book':
            data = await getBookTOC(user.uid, entityId);
            setEntityData(data);
            break;
          case 'part':
            data = await getPartTOC(user.uid, parentIds.bookId!, entityId);
            setEntityData(data);
            break;
          case 'chapter': {
            if (!parentIds.bookId || !parentIds.partId) {
              throw new Error('Book ID and Part ID required for chapter');
            }
            const bookData = await getBookTOC(user.uid, parentIds.bookId);
            const partData = bookData.parts?.find((p: { part: { id: string } }) => p.part.id === parentIds.partId);
            const chapterData = partData?.chapters?.find((c: { id: string }) => c.id === entityId);
            
            if (!chapterData) throw new Error('Chapter not found');
            
            // Load sections for this chapter
            const sections = await listSections(user.uid, parentIds.bookId, parentIds.partId, entityId);
            console.log('Loaded sections:', sections);
            
            setEntityData({
              chapter: chapterData,
              sections: sections
            });
            break;
          }
        }
      };
      await loadData();
      console.log('Data reloaded, closing modal');
      setCreateChildModalOpen(false);
    } catch (error) {
      console.error('Error creating child:', error);
      alert(`Error creating ${levelConfig.childLabel.toLowerCase()}`);
    }
  };

  // Generic edit current entity function
  const handleEditEntity = () => {
    setEditModalOpen(true);
  };

  // Generic save entity function
  const handleSaveEntity = async (title: string, summary: string) => {
    if (!entityData || !user?.uid) return;

    try {
      const updateData = { title, summary };

      switch (level) {
        case 'book':
          await updateBook(user.uid, entityId, updateData);
          break;
        case 'part':
          if (!parentIds.bookId) return;
          await updatePart(user.uid, parentIds.bookId, entityId, updateData);
          break;
        case 'chapter':
          if (!parentIds.bookId || !parentIds.partId) return;
          await updateChapter(user.uid, parentIds.bookId, parentIds.partId, entityId, updateData);
          break;
        default:
          console.log('Update not implemented for', level);
          return;
      }

      // Reload data
      const loadData = async () => {
        let data: any;
        switch (level) {
          case 'book':
            data = await getBookTOC(user.uid, entityId);
            setEntityData(data);
            break;
          case 'part':
            data = await getPartTOC(user.uid, parentIds.bookId!, entityId);
            setEntityData(data);
            break;
          // Add chapter case when needed
        }
      };
      await loadData();
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating entity:', error);
      alert(`Error updating ${levelConfig.entityLabel.toLowerCase()}`);
    }
  };

  // Generic delete child function
  const handleDeleteChild = async (childId: string, title: string) => {
    if (!user?.uid) return;
    
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      switch (level) {
        case 'book':
          await deletePart(user.uid, entityId, childId);
          break;
        case 'part':
          if (!parentIds.bookId) return;
          await deleteChapter(user.uid, parentIds.bookId, entityId, childId);
          break;
        case 'chapter':
          if (!parentIds.bookId || !parentIds.partId) return;
          await deleteSection(user.uid, parentIds.bookId, parentIds.partId, entityId, childId);
          break;
        default:
          console.log('Delete not implemented for', level);
          return;
      }

      // Reload data
      const loadData = async () => {
        let data: any;
        switch (level) {
          case 'book':
            data = await getBookTOC(user.uid, entityId);
            setEntityData(data);
            break;
          case 'part':
            data = await getPartTOC(user.uid, parentIds.bookId!, entityId);
            setEntityData(data);
            break;
          case 'chapter': {
            if (!parentIds.bookId || !parentIds.partId) {
              throw new Error('Book ID and Part ID required for chapter');
            }
            const bookData = await getBookTOC(user.uid, parentIds.bookId);
            const partData = bookData.parts?.find((p: { part: { id: string } }) => p.part.id === parentIds.partId);
            const chapterData = partData?.chapters?.find((c: { id: string }) => c.id === entityId);
            
            if (!chapterData) throw new Error('Chapter not found');
            
            // Load sections for this chapter
            const sections = await listSections(user.uid, parentIds.bookId, parentIds.partId, entityId);
            
            setEntityData({
              chapter: chapterData,
              sections: sections
            });
            break;
          }
        }
      };
      await loadData();
    } catch (error) {
      console.error('Error deleting child:', error);
      alert(`Error deleting ${levelConfig.childLabel.toLowerCase()}`);
    }
  };

  // Generic reorder children function
  const handleReorderChildren = async (activeId: string, overId: string) => {
    if (!user?.uid || !entityData) return;
    
    try {
      // Get current children and create new order
      let children: any[] = [];
      switch (level) {
        case 'book':
          children = entityData.parts || [];
          break;
        case 'part':
          children = entityData.chapters || [];
          break;
        case 'chapter':
          children = entityData.sections || [];
          break;
      }

      const currentIds = children.map((child: any) => {
        switch (level) {
          case 'book':
            return child.part.id;
          default:
            return child.id;
        }
      });

      const activeIndex = currentIds.indexOf(activeId);
      const overIndex = currentIds.indexOf(overId);
      
      const newOrder = [...currentIds];
      newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, activeId);

      switch (level) {
        case 'book':
          await reorderParts(user.uid, entityId, newOrder);
          break;
        case 'part':
          if (!parentIds.bookId) return;
          await reorderChapters(user.uid, parentIds.bookId, entityId, newOrder);
          break;
        case 'chapter':
          if (!parentIds.bookId || !parentIds.partId) return;
          await reorderSections(user.uid, parentIds.bookId, parentIds.partId, entityId, newOrder);
          break;
        default:
          console.log('Reorder not implemented for', level);
          return;
      }

      // Reload data
      const loadData = async () => {
        let data: any;
        switch (level) {
          case 'book':
            data = await getBookTOC(user.uid, entityId);
            setEntityData(data);
            break;
          case 'part':
            data = await getPartTOC(user.uid, parentIds.bookId!, entityId);
            setEntityData(data);
            break;
          // Add chapter case when needed
        }
      };
      await loadData();
    } catch (error) {
      console.error('Error reordering children:', error);
      throw error; // Re-throw to trigger optimistic rollback
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (!entityData) {
    return <EntityListView
      entityData={{ id: '', title: '', summary: '' }}
      items={[]}
      config={{
        entityType: level,
        childType: levelConfig.childType,
        entityLabel: levelConfig.entityLabel,
        childLabel: levelConfig.childLabel,
        childLabelPlural: levelConfig.childLabelPlural,
        numberStyle: levelConfig.numberStyle,
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

  // Transform entity data for EntityListView
  let entityForView: EntityData;
  let children: ChildData[] = [];

  switch (level) {
    case 'book':
      entityForView = {
        id: entityData.id,
        title: entityData.title,
        summary: entityData.summary
      };
      children = entityData.parts?.map((partData: any) => ({
        id: partData.part.id,
        title: partData.part.title,
        summary: partData.part.summary,
        chapters: partData.chapters
      })) || [];
      break;
      
    case 'part':
      entityForView = {
        id: entityData.part.id,
        title: entityData.part.title,
        summary: entityData.part.summary
      };
      children = entityData.chapters?.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        summary: chapter.summary,
        sections: [] // TODO: Load sections when implemented
      })) || [];
      break;
      
    case 'chapter':
      entityForView = {
        id: entityData.chapter.id,
        title: entityData.chapter.title,
        summary: entityData.chapter.summary
      };
      children = entityData.sections?.map((section: any) => ({
        id: section.id,
        title: section.title,
        summary: section.summary  // Sections use summary for chapter view
      })) || [];
      break;
      
    default:
      entityForView = { id: '', title: '', summary: '' };
  }

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Books', href: '/' }
  ];

  if (level === 'part' || level === 'chapter') {
    breadcrumbs.push({ 
      label: 'Book', // TODO: Get actual book title
      href: `/books/${parentIds.bookId}` 
    });
  }

  if (level === 'chapter') {
    breadcrumbs.push({ 
      label: 'Part', // TODO: Get actual part title
      href: `/books/${parentIds.bookId}/parts/${parentIds.partId}` 
    });
  }

  breadcrumbs.push({ label: entityForView.title });

  // Build child path function
  const getChildPath = (child: ChildData) => {
    switch (level) {
      case 'book':
        return `/books/${entityId}/parts/${child.id}`;
      case 'part':
        return `/books/${parentIds.bookId}/parts/${entityId}/chapters/${child.id}`;
      case 'chapter':
        return `/books/${parentIds.bookId}/parts/${parentIds.partId}/chapters/${entityId}/sections/${child.id}`;
      default:
        return '';
    }
  };

  // Build child count function
  const getChildCount = (child: ChildData) => {
    switch (level) {
      case 'book':
        return (child.chapters as unknown[])?.length || 0;
      case 'part':
        return (child.sections as unknown[])?.length || 0;
      default:
        return 0;
    }
  };

  // Build entity config
  const entityConfig: EntityListViewConfig = {
    entityType: level,
    childType: levelConfig.childType,
    entityLabel: levelConfig.entityLabel,
    childLabel: levelConfig.childLabel,
    childLabelPlural: levelConfig.childLabelPlural,
    numberStyle: levelConfig.numberStyle,
    showOverview: true
  };

  // Build extra actions
  const editButton = (
    <button
      type="button"
      onClick={handleEditEntity}
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
      ✏️ Edit {levelConfig.entityLabel}
    </button>
  );

  return (
    <>
      {level === 'section' ? (
        // Special view for sections - they don't have children
        <div style={{ padding: '20px' }}>
          <h1>{entityData?.section?.title || 'Untitled Section'}</h1>
          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={handleEditEntity}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              ✏️ Edit Section
            </button>
            <button
              type="button"
              onClick={() => setOverviewModalOpen(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📄 Section Overview
            </button>
          </div>
          <div style={{ 
            marginTop: '20px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Section Content</h3>
            <div style={{ 
              whiteSpace: 'pre-wrap',  // Preserves whitespace and line breaks
              fontSize: '14px',
              lineHeight: '1.5',
              minHeight: '100px',
              padding: '10px',
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              {entityData?.section?.content || 'No content yet. Click "Edit Section" to add content.'}
            </div>
          </div>
        </div>
      ) : (
        <EntityListView
          entityData={entityForView}
          items={children}
          config={entityConfig}
          breadcrumbs={breadcrumbs}
          loading={loading}
          onEdit={(id, title, summary) => {
            // For children, we'll handle editing differently
            alert(`${levelConfig.childLabel} editing not yet implemented`);
          }}
          onDelete={handleDeleteChild}
          onCreate={handleCreateChild}
          onReorder={handleReorderChildren}
          onShowOverview={() => setOverviewModalOpen(true)}
          getChildPath={getChildPath}
          getChildCount={getChildCount}
          extraActions={editButton}
        />
      )}
      

      <EntityEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEntity}
        initialTitle={entityForView?.title || ''}
        initialSummary={entityForView?.summary || ''}
        entityType={level}
        mode="edit"
      />

      <EntityEditModal
        isOpen={createChildModalOpen}
        onClose={() => setCreateChildModalOpen(false)}
        onSave={handleSaveNewChild}
        initialTitle=""
        initialSummary=""
        entityType={levelConfig.childType}
        mode="create"
      />

      <EntityOverview
        isOpen={overviewModalOpen}
        onClose={() => setOverviewModalOpen(false)}
        entityData={entityData}
        entityType={level}
        childrenData={children}
      />
    </>
  );
}