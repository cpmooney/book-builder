/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper function to convert number to Roman numerals
function toRoman(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  
  let result = '';
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += symbols[i];
      num -= values[i];
    }
  }
  return result;
}

// Helper function to convert number to alphabetic (A, B, C, ...)
function toAlpha(num: number): string {
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

// Helper function to format numbers based on style
function formatNumber(num: number, style: 'roman' | 'numeric' | 'alpha' | 'bullet' = 'numeric'): string {
  switch (style) {
    case 'roman':
      return toRoman(num);
    case 'alpha':
      return toAlpha(num);
    case 'bullet':
      return '•';
    case 'numeric':
    default:
      return num.toString();
  }
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface EntityData {
  id: string;
  title: string;
  summary?: string;
}

export interface ChildData extends EntityData {
  chapters?: unknown[];
  sections?: unknown[];
  content?: string;
  markedForDeletion?: boolean;
  [key: string]: unknown;
}

export interface EntityListViewConfig {
  entityType: 'book' | 'part' | 'chapter' | 'section';
  childType: 'part' | 'chapter' | 'section';
  entityLabel: string;
  childLabel: string;
  childLabelPlural: string;
  numberStyle?: 'roman' | 'numeric' | 'alpha' | 'bullet';
  showOverview?: boolean;
}

export interface EntityListViewProps {
  entityData: EntityData;
  items: ChildData[];
  config: EntityListViewConfig;
  breadcrumbs: BreadcrumbItem[];
  loading: boolean;
  onEdit: (id: string, title: string, summary: string) => void;
  onDelete: (id: string, title: string) => void;
  onMove?: (id: string) => void;
  onCreate: () => Promise<void>;
  onReorder: (activeId: string, overId: string) => Promise<void>;
  onShowOverview?: () => void;
  getChildPath: (child: ChildData) => string;
  getChildCount?: (child: ChildData) => number;
  extraActions?: ReactNode;
}

interface SortableChildItemProps {
  child: ChildData;
  childNumber: number;
  config: EntityListViewConfig;
  onEdit: (id: string, title: string, summary: string) => void;
  onDelete: (id: string, title: string) => void;
  onMove?: (id: string) => void;
  getChildPath: (child: ChildData) => string;
  getChildCount?: (child: ChildData) => number;
}

function SortableChildItem({ 
  child, 
  childNumber, 
  config,
  onEdit, 
  onDelete, 
  onMove,
  getChildPath,
  getChildCount
}: Readonly<SortableChildItemProps>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: child.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const childCount = getChildCount ? getChildCount(child) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
        child.markedForDeletion 
          ? 'border-orange-400 bg-orange-50' 
          : 'border-gray-300 bg-white'
      }`}
    >
      {child.markedForDeletion && (
        <div className="mb-3 p-2 bg-orange-100 border border-orange-300 rounded text-orange-800 text-sm">
          ⚠️ <strong>Marked for deletion</strong> - This chapter was moved to another part. Verify the move completed successfully, then delete this chapter manually.
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            padding: '6px',
            border: '2px dashed #ccc',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '24px',
            height: '24px',
            fontSize: '12px',
            flexShrink: 0
          }}
        >
          ⋮⋮
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link 
            href={getChildPath(child)}
            style={{ 
              textDecoration: child.markedForDeletion ? 'line-through' : 'none',
              color: child.markedForDeletion ? '#d97706' : '#007bff',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'block',
              wordBreak: 'break-word',
              opacity: child.markedForDeletion ? 0.7 : 1
            }}
          >
            {config.numberStyle && (
              <span style={{ color: '#666', marginRight: '8px' }}>
                {formatNumber(childNumber, config.numberStyle)}.
              </span>
            )}
            {child.title}
          </Link>
          {child.summary && (
            <div style={{ position: 'relative', marginTop: '8px' }}>
              <p style={{ 
                color: '#666', 
                fontSize: '14px', 
                fontStyle: 'italic',
                margin: '0',
                wordBreak: 'break-word',
                lineHeight: '1.4',
                maxHeight: '4.2em', // 3 lines at 1.4 line-height = 4.2em
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}>
                {child.summary}
              </p>
              {/* Fade gradient overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '1.4em', // Height of one line
                background: 'linear-gradient(to bottom, transparent, white)',
                pointerEvents: 'none'
              }} />
            </div>
          )}
        </div>
      </div>
      {/* Child count and actions - stacked for mobile */}
      <div style={{ marginTop: '12px' }}>
        {config.childType === 'section' ? (
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Word Count: {(() => {
              console.log(`🎯 EntityListView rendering section ${child.id}:`, {
                title: child.title,
                content: child.content,
                contentType: typeof child.content,
                contentLength: child.content?.length || 0,
                summary: child.summary,
                summaryLength: child.summary?.length || 0,
                allKeys: Object.keys(child)
              });
              
              const content = child.content || '';
              const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
              
              console.log(`   - Word count calculation:`, {
                contentExists: !!content,
                contentTrimmed: content.trim(),
                wordCount
              });
              
              return wordCount > 0 ? `${wordCount} words` : 'No content yet';
            })()}
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            {config.childLabelPlural}: {childCount > 0 ? (
              <span>{childCount}</span>
            ) : (
              <span style={{ color: '#999' }}>No {config.childLabelPlural.toLowerCase()} yet</span>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(child.id, child.title, child.summary || '');
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Edit
          </button>
          {onMove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMove(child.id);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Copy
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(child.id, child.title);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EntityListView({
  entityData,
  items: initialItems,
  config,
  breadcrumbs,
  loading,
  onEdit,
  onDelete,
  onMove,
  onCreate,
  onReorder,
  getChildPath,
  getChildCount,
  extraActions
}: Readonly<EntityListViewProps>) {
  const [items, setItems] = useState<ChildData[]>(initialItems);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      const originalItems = [...items];
      setItems(newItems);

      try {
        await onReorder(String(active.id), String(over.id));
      } catch (error) {
        console.error('Error reordering:', error);
        // Revert the optimistic update
        setItems(originalItems);
      }
    }
  };

  // Update items when initialItems prop changes
  if (initialItems !== items) {
    setItems(initialItems);
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '100%', margin: '0 auto' }}>
      {/* Breadcrumbs */}
      <nav style={{ 
        marginBottom: '16px', 
        fontSize: '14px',
        padding: '8px 0',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} style={{ display: 'inline-block' }}>
            {crumb.href ? (
              <Link href={crumb.href} style={{ 
                color: '#007bff', 
                textDecoration: 'none',
                padding: '4px 0',
                display: 'inline-block'
              }}>
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: '#666', padding: '4px 0', display: 'inline-block' }}>{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <span style={{ margin: '0 6px', color: '#999' }}>→</span>
            )}
          </span>
        ))}
      </nav>

      {/* Entity Header */}
      <div style={{ marginBottom: '30px' }}>
        {/* Title */}
        <h1 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '24px', 
          fontWeight: 'bold',
          lineHeight: '1.2',
          wordBreak: 'break-word'
        }}>
          {config.entityLabel}: {entityData.title}
        </h1>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          {extraActions}
        </div>
        
        {entityData.summary && (
          <div style={{ position: 'relative', margin: '0 0 16px 0' }}>
            <p style={{ 
              color: '#666', 
              fontSize: '16px', 
              lineHeight: '1.5',
              fontStyle: 'italic',
              margin: '0',
              maxHeight: '4.5em', // 3 lines at 1.5 line-height = 4.5em
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}>
              {entityData.summary}
            </p>
            {/* Fade gradient overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1.5em', // Height of one line
              background: 'linear-gradient(to bottom, transparent, white)',
              pointerEvents: 'none'
            }} />
          </div>
        )}
        
        <button
          type="button"
          onClick={onCreate}
          style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          + Add New {config.childLabel}
        </button>
      </div>

      {/* Children List */}
      <div>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
          {config.childLabelPlural} ({items.length})
        </h2>
        
        {items.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '2px dashed #dee2e6'
          }}>
            <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
              No {config.childLabelPlural.toLowerCase()} yet. Click "Add New {config.childLabel}" to get started!
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {items.map((child, index) => (
                  <SortableChildItem
                    key={child.id}
                    child={child}
                    childNumber={index + 1}
                    config={config}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMove={onMove}
                    getChildPath={getChildPath}
                    getChildCount={getChildCount}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}