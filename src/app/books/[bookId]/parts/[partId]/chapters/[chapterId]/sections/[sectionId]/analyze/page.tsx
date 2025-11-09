'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSectionContent, updateSection } from '@/features/books/data';
import { analyzeSection } from '@/lib/analysis';
import type { Section } from '@/types/book-builder';
import type { TightnessAnalysis } from '@/types/analysis';

export default function AnalyzeSectionPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const bookId = params.bookId as string;
  const partId = params.partId as string;
  const chapterId = params.chapterId as string;
  const sectionId = params.sectionId as string;
  
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in');
      return;
    }

    if (user?.uid) {
      void loadSection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadSection = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const data = await getSectionContent(user.uid, bookId, partId, chapterId, sectionId);
      setSection(data.section);
      setError(null);
    } catch (err) {
      console.error('Error loading section:', err);
      setError('Failed to load section');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!user?.uid || !section) return;

    if (!section.content || section.content.trim().length === 0) {
      setError('Section must have content to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      const result = await analyzeSection({
        content: section.content,
        summary: section.analysis?.summary || section.summary || '',
        sectionTitle: section.title
      });

      if (!result.success) {
        setError(result.error || 'Failed to analyze section');
        return;
      }

      // Update Firestore with analysis results
      const updatedAnalysis = {
        summary: result.summary,
        tightness: result.tightnessResults,
        lastAnalyzed: new Date()
      };

      await updateSection(user.uid, bookId, partId, chapterId, sectionId, {
        title: section.title,
        summary: section.summary,
        content: section.content,
        analysis: updatedAnalysis
      });

      // Update local state
      setSection({
        ...section,
        analysis: updatedAnalysis
      });

      console.log('✅ Analysis saved successfully');
    } catch (err) {
      console.error('Error analyzing section:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze section');
    } finally {
      setAnalyzing(false);
    }
  };

  const goBack = () => {
    router.push(`/books/${bookId}/parts/${partId}/chapters/${chapterId}/sections/${sectionId}`);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!section) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1>Section Not Found</h1>
        <button type="button" onClick={goBack}>← Back to Section</button>
      </div>
    );
  }

  const hasContent = section.content && section.content.trim().length > 0;
  const hasAnalysis = section.analysis?.tightness && section.analysis.tightness.length > 0;

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            type="button"
            onClick={goBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#007bff'
            }}
          >
            ← Back to Section
          </button>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            📊 Analysis: {section.title}
          </h1>
        </div>
        
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing || !hasContent}
          style={{
            padding: '10px 20px',
            backgroundColor: analyzing ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: analyzing || !hasContent ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: analyzing || !hasContent ? 0.6 : 1
          }}
        >
          {analyzing ? '🔄 Analyzing...' : '🔍 Run Analysis'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* No Content Warning */}
      {!hasContent && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          ⚠️ This section has no content yet. Add content to enable analysis.
        </div>
      )}

      {/* Summary Section */}
      {section.analysis?.summary && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            marginBottom: '10px',
            color: '#333'
          }}>
            📝 Generated Summary
          </h2>
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            lineHeight: '1.6'
          }}>
            {section.analysis.summary}
          </div>
        </div>
      )}

      {/* Tightness Analysis Results */}
      {hasAnalysis && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h2 style={{ fontSize: '18px', margin: 0, color: '#333' }}>
              🎯 Tightness Analysis
            </h2>
            {section.analysis?.lastAnalyzed && (
              <span style={{ fontSize: '12px', color: '#6c757d' }}>
                Last analyzed: {new Date(
                  typeof section.analysis.lastAnalyzed === 'object' && 'seconds' in section.analysis.lastAnalyzed
                    ? section.analysis.lastAnalyzed.seconds * 1000
                    : section.analysis.lastAnalyzed
                ).toLocaleString()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {section.analysis?.tightness?.map((analysis: TightnessAnalysis, index: number) => (
              <div
                key={`analysis-${index}-${analysis.score}`}
                style={{
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {/* Score Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    color: '#6c757d'
                  }}>
                    Analysis #{index + 1}
                  </span>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 16px',
                    backgroundColor: getScoreColor(analysis.score),
                    borderRadius: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    Score: {analysis.score}/10
                  </div>
                  {analysis.timestamp && (
                    <span style={{ fontSize: '11px', color: '#999', marginLeft: 'auto' }}>
                      {new Date(
                        typeof analysis.timestamp === 'object' && 'seconds' in analysis.timestamp
                          ? analysis.timestamp.seconds * 1000
                          : analysis.timestamp
                      ).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* Reasoning */}
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#495057'
                  }}>
                    💭 Reasoning
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    lineHeight: '1.6',
                    color: '#212529'
                  }}>
                    {analysis.reasoning}
                  </p>
                </div>

                {/* Suggestions */}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <div>
                    <h3 style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: '#495057'
                    }}>
                      💡 Suggestions for Improvement
                    </h3>
                    <ul style={{ 
                      margin: 0, 
                      paddingLeft: '20px',
                      lineHeight: '1.8',
                      color: '#212529'
                    }}>
                      {analysis.suggestions.map((suggestion: string, idx: number) => (
                        <li key={`suggestion-${idx}-${suggestion.substring(0, 20)}`}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Average Score (if multiple analyses) */}
          {section.analysis?.tightness && section.analysis.tightness.length > 1 && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#e7f3ff',
              border: '2px solid #007bff',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <strong style={{ fontSize: '16px' }}>
                📈 Average Score: {
                  (section.analysis.tightness.reduce((sum: number, a: TightnessAnalysis) => sum + a.score, 0) / 
                   section.analysis.tightness.length).toFixed(1)
                }/10
              </strong>
              <div style={{ fontSize: '12px', color: '#495057', marginTop: '5px' }}>
                Based on {section.analysis.tightness.length} analysis runs
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Analysis Yet */}
      {!hasAnalysis && hasContent && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #dee2e6',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '16px', color: '#6c757d', margin: 0 }}>
            No analysis results yet. Click "Run Analysis" to analyze this section's tightness.
          </p>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 9) return '#28a745'; // Green
  if (score >= 7) return '#20c997'; // Teal
  if (score >= 4) return '#ffc107'; // Yellow
  return '#dc3545'; // Red
}
