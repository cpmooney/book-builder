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
  getChildPath: (child: ChildData) => string;
  getChildCount?: (child: ChildData) => number;
}

function SortableChildItem({ 
  child, 
  childNumber, 
  config,
  onEdit, 
  onDelete, 
  getChildPath,
  getChildCount
}: SortableChildItemProps) {
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
      className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            padding: '8px',
            border: '2px dashed #ccc',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            height: '32px'
          }}
        >
          ⋮⋮
        </div>
        <div style={{ flex: 1 }}>
          <Link 
            href={getChildPath(child)}
            style={{ 
              textDecoration: 'none', 
              color: '#007bff',
              fontSize: '18px',
              fontWeight: 'bold'
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
            <p style={{ 
              color: '#666', 
              fontSize: '14px', 
              marginTop: '8px',
              fontStyle: 'italic'
            }}>
              {child.summary}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {config.childLabelPlural}: {childCount > 0 ? (
            <span>{childCount}</span>
          ) : (
            <span style={{ color: '#999' }}>No {config.childLabelPlural.toLowerCase()} yet</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(child.id, child.title, child.summary || '');
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
              onDelete(child.id, child.title);
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
  onCreate,
  onReorder,
  onShowOverview,
  getChildPath,
  getChildCount,
  extraActions
}: EntityListViewProps) {
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumbs */}
      <nav style={{ marginBottom: '20px', fontSize: '14px' }}>
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`}>
            {crumb.href ? (
              <Link href={crumb.href} style={{ color: '#007bff', textDecoration: 'none' }}>
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: '#666' }}>{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <span style={{ margin: '0 8px', color: '#999' }}>→</span>
            )}
          </span>
        ))}
      </nav>

      {/* Entity Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            {config.entityLabel}: {entityData.title}
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {config.showOverview && onShowOverview && (
              <button
                type="button"
                onClick={onShowOverview}
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
                📖 {config.entityLabel} Overview
              </button>
            )}
            {extraActions}
          </div>
        </div>
        
        {entityData.summary && (
          <p style={{ 
            color: '#666', 
            fontSize: '16px', 
            lineHeight: '1.5',
            fontStyle: 'italic',
            margin: '0 0 16px 0'
          }}>
            {entityData.summary}
          </p>
        )}
        
        <button
          type="button"
          onClick={onCreate}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
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