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

function calculateChapterCompletion(sections?: unknown[]): { completed: number; total: number; percentage: number } {
  if (!sections || !Array.isArray(sections)) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  
  const total = sections.length;
  const completed = sections.filter((section: any) => {
    const content = section.content || '';
    return content.trim().length > 0;
  }).length;
  
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

function calculatePartCompletion(chapters?: unknown[]): { completed: number; total: number; percentage: number } {
  if (!chapters || !Array.isArray(chapters)) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  
  let totalSections = 0;
  let completedSections = 0;
  
  for (const chapter of chapters) {
    const chapterSections = (chapter as any).sections;
    if (chapterSections && Array.isArray(chapterSections)) {
      totalSections += chapterSections.length;
      completedSections += chapterSections.filter((section: any) => {
        const content = section.content || '';
        return content.trim().length > 0;
      }).length;
    }
  }
  
  const percentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  return { completed: completedSections, total: totalSections, percentage };
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
  onDelete: (id: string, title: string) => void;
  onMove?: (id: string) => void;
  getChildPath: (child: ChildData) => string;
  getChildCount?: (child: ChildData) => number;
}

function SortableChildItem({ 
  child, 
  childNumber, 
  config,
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
          <div style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {(() => {
              const content = child.content || '';
              const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
              const hasContent = wordCount > 0;
              
              // Get tightness analysis data
              const analysis = (child as { analysis?: { tightness?: Array<{ score: number }> } }).analysis;
              const tightnessResults = analysis?.tightness;
              const hasTightness = tightnessResults && Array.isArray(tightnessResults) && tightnessResults.length > 0;
              const minScore = hasTightness 
                ? Math.min(...tightnessResults.map((t) => t.score))
                : null;
              
              // Debug logging - log ALL sections to see what data we have
              console.log('🔍 Section Debug:', {
                title: child.title,
                hasAnalysis: !!analysis,
                analysisKeys: analysis ? Object.keys(analysis) : [],
                tightnessResults,
                hasTightness,
                minScore,
                childKeys: Object.keys(child)
              });
              
              // Determine badge colors
              const getBgColor = (score: number) => {
                if (score >= 7) return '#d1fae5';
                if (score >= 4) return '#fef3c7';
                return '#fee2e2';
              };
              const getBorderColor = (score: number) => {
                if (score >= 7) return '#10b981';
                if (score >= 4) return '#f59e0b';
                return '#ef4444';
              };
              const getTextColor = (score: number) => {
                if (score >= 7) return '#065f46';
                if (score >= 4) return '#92400e';
                return '#991b1b';
              };
              
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '18px',
                      filter: hasContent ? 'none' : 'grayscale(1)',
                    }}>
                      {hasContent ? '✅' : '⚠️'}
                    </span>
                    <span style={{ color: hasContent ? '#666' : '#e67e22', fontWeight: hasContent ? 'normal' : 'bold' }}>
                      {hasContent ? `${wordCount} words` : 'No content yet'}
                    </span>
                  </div>
                  
                  {hasTightness && minScore !== null && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      backgroundColor: getBgColor(minScore),
                      border: `1px solid ${getBorderColor(minScore)}`,
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: getTextColor(minScore)
                    }}>
                      <span>🎯</span>
                      <span>Tightness: {minScore}/10</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : config.childType === 'chapter' ? (
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            {(() => {
              const sections = child.sections as unknown[];
              const metrics = calculateChapterCompletion(sections);
              
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ color: '#666', fontSize: '13px' }}>
                        Sections: {metrics.completed}/{metrics.total} complete
                      </span>
                      <span style={{ 
                        color: metrics.percentage >= 100 ? '#10b981' : metrics.percentage >= 50 ? '#3b82f6' : '#e67e22',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        {metrics.percentage}%
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#e5e7eb', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${metrics.percentage}%`, 
                        height: '100%', 
                        backgroundColor: metrics.percentage >= 100 ? '#10b981' : metrics.percentage >= 50 ? '#3b82f6' : '#e67e22',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : config.childType === 'part' ? (
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            {(() => {
              const chapters = child.chapters as unknown[];
              const metrics = calculatePartCompletion(chapters);
              
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ color: '#666', fontSize: '13px' }}>
                        Sections: {metrics.completed}/{metrics.total} complete
                      </span>
                      <span style={{ 
                        color: metrics.percentage >= 100 ? '#10b981' : metrics.percentage >= 50 ? '#3b82f6' : '#e67e22',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        {metrics.percentage}%
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#e5e7eb', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${metrics.percentage}%`, 
                        height: '100%', 
                        backgroundColor: metrics.percentage >= 100 ? '#10b981' : metrics.percentage >= 50 ? '#3b82f6' : '#e67e22',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
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
          <Link
            href={`${getChildPath(child)}/edit`}
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
              alignItems: 'center',
              textDecoration: 'none'
            }}
          >
            Edit
          </Link>
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