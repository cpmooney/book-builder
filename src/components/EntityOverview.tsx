'use client';

import { useState } from 'react';

interface EntityOverviewProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly entityData: any;
  readonly entityType: 'book' | 'part' | 'chapter';
  readonly childrenData: any[];
}

export default function EntityOverview({ 
  isOpen, 
  onClose, 
  entityData, 
  entityType, 
  childrenData 
}: EntityOverviewProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !entityData) return null;

  // Helper function to convert number to Roman numerals
  const toRoman = (num: number): string => {
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
  };

  // Get entity-specific data based on type
  const getEntityInfo = () => {
    switch (entityType) {
      case 'book':
        return {
          title: entityData?.title || 'Untitled Book',
          summary: entityData?.summary || '',
          status: entityData?.status || 'Unknown',
          childLabel: 'Parts',
          grandChildLabel: 'Chapters'
        };
      case 'part':
        return {
          title: entityData?.part?.title || entityData?.title || 'Untitled Part',
          summary: entityData?.part?.summary || entityData?.summary || '',
          status: entityData?.part?.status || entityData?.status || 'Unknown',
          childLabel: 'Chapters',
          grandChildLabel: 'Sections'
        };
      case 'chapter':
        return {
          title: entityData?.chapter?.title || entityData?.title || 'Untitled Chapter',
          summary: entityData?.chapter?.summary || entityData?.summary || '',
          status: entityData?.chapter?.status || entityData?.status || 'Unknown',
          childLabel: 'Sections',
          grandChildLabel: 'Blocks'
        };
      default:
        return {
          title: 'Unknown Entity',
          summary: '',
          status: 'Unknown',
          childLabel: 'Items',
          grandChildLabel: 'Sub-items'
        };
    }
  };

  const entityInfo = getEntityInfo();

  // Function to generate text version of the overview
  const generateOverviewText = (): string => {
    const title = entityInfo.title;
    let text = `${title}\n`;
    text += '='.repeat(title.length) + '\n\n';
    
    if (entityInfo.summary) {
      text += `${entityInfo.summary}\n\n`;
    }
    
    text += `Status: ${entityInfo.status}\n`;
    text += `${entityInfo.childLabel}: ${childrenData?.length || 0}\n`;
    
    // Calculate total grandchildren
    let totalGrandChildren = 0;
    if (entityType === 'book') {
      totalGrandChildren = childrenData?.reduce((total: number, child: any) =>
        total + (child.chapters?.length || 0), 0) || 0;
    } else if (entityType === 'part') {
      totalGrandChildren = childrenData?.reduce((total: number, child: any) =>
        total + (child.sections?.length || 0), 0) || 0;
    }
    
    if (totalGrandChildren > 0) {
      text += `Total ${entityInfo.grandChildLabel}: ${totalGrandChildren}\n`;
    }
    text += '\n';
    
    if (childrenData && childrenData.length > 0) {
      text += `${entityInfo.childLabel.toUpperCase()} OVERVIEW\n`;
      text += '-'.repeat(`${entityInfo.childLabel} OVERVIEW`.length) + '\n\n';
      
      for (const [index, child] of childrenData.entries()) {
        const childNumber = entityType === 'book' ? toRoman(index + 1) : (index + 1).toString();
        const childTitle = child.title || `Untitled ${entityInfo.childLabel.slice(0, -1)}`;
        const childSummary = child.summary || '';
        
        text += `${childNumber}. ${childTitle}\n`;
        if (childSummary) {
          text += `   ${childSummary}\n`;
        }
        
        // Add grandchildren count
        let grandChildrenCount = 0;
        if (entityType === 'book' && child.chapters) {
          grandChildrenCount = child.chapters.length;
        } else if (entityType === 'part' && child.sections) {
          grandChildrenCount = child.sections.length;
        }
        
        if (grandChildrenCount > 0) {
          text += `   ${entityInfo.grandChildLabel}: ${grandChildrenCount}\n`;
        }
        text += '\n';
      }
    }
    
    return text;
  };

  // Function to copy overview text to clipboard
  const copyToClipboard = async () => {
    try {
      const text = generateOverviewText();
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard');
    }
  };

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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: 0,
            color: '#333',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            {entityInfo.title} - Overview
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {entityInfo.summary && (
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            borderLeft: '4px solid #007bff'
          }}>
            <h4 style={{
              margin: '0 0 8px 0',
              color: '#333',
              fontSize: '16px'
            }}>
              Summary
            </h4>
            <p style={{
              margin: 0,
              color: '#666',
              lineHeight: '1.5'
            }}>
              {entityInfo.summary}
            </p>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#e3f2fd',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1976d2'
            }}>
              {childrenData?.length || 0}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginTop: '4px'
            }}>
              {entityInfo.childLabel}
            </div>
          </div>

          {entityType !== 'chapter' && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f3e5f5',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#7b1fa2'
              }}>
                {entityType === 'book' 
                  ? childrenData?.reduce((total: number, child: any) => total + (child.chapters?.length || 0), 0) || 0
                  : childrenData?.reduce((total: number, child: any) => total + (child.sections?.length || 0), 0) || 0
                }
              </div>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginTop: '4px'
              }}>
                Total {entityInfo.grandChildLabel}
              </div>
            </div>
          )}

          <div style={{
            padding: '16px',
            backgroundColor: '#e8f5e8',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#2e7d32'
            }}>
              {entityInfo.status}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginTop: '4px'
            }}>
              Status
            </div>
          </div>
        </div>

        {childrenData && childrenData.length > 0 && (
          <div>
            <h3 style={{
              margin: '0 0 16px 0',
              color: '#333',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              {entityInfo.childLabel}
            </h3>
            
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: '6px'
            }}>
              {childrenData.map((child: any, index: number) => {
                const childNumber = entityType === 'book' ? toRoman(index + 1) : (index + 1).toString();
                const childTitle = child.title || `Untitled ${entityInfo.childLabel.slice(0, -1)}`;
                const childSummary = child.summary || '';
                
                let grandChildrenCount = 0;
                if (entityType === 'book' && child.chapters) {
                  grandChildrenCount = child.chapters.length;
                } else if (entityType === 'part' && child.sections) {
                  grandChildrenCount = child.sections.length;
                }

                return (
                  <div
                    key={child.id || index}
                    style={{
                      padding: '12px 16px',
                      borderBottom: index < childrenData.length - 1 ? '1px solid #e0e0e0' : 'none'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: childSummary ? '8px' : '0'
                    }}>
                      <h4 style={{
                        margin: 0,
                        color: '#333',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}>
                        {childNumber}. {childTitle}
                      </h4>
                      {grandChildrenCount > 0 && (
                        <span style={{
                          backgroundColor: '#f0f0f0',
                          color: '#666',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {grandChildrenCount} {entityInfo.grandChildLabel.toLowerCase()}
                        </span>
                      )}
                    </div>
                    {childSummary && (
                      <p style={{
                        margin: 0,
                        color: '#666',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {childSummary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{
          marginTop: '24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '10px 20px',
              backgroundColor: copySuccess ? '#28a745' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
          >
            {copySuccess ? '✓ Copied!' : '📋 Copy Overview'}
          </button>
          <button
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}