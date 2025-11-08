'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getChapterSummary, updateChapter } from '@/features/books/data';
import type { Chapter } from '@/types/book-builder';

export default function EditChapterPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const bookId = params.bookId as string;
  const partId = params.partId as string;
  const chapterId = params.chapterId as string;
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in');
      return;
    }

    if (user?.uid) {
      loadChapter();
    }
  }, [user, authLoading]);

  const loadChapter = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const data = await getChapterSummary(user.uid, bookId, partId, chapterId);
      setChapter(data.chapter);
      setTitle(data.chapter.title);
      setSummary(data.chapter.summary || '');
    } catch (err) {
      console.error('Error loading chapter:', err);
      setError('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid || !chapter) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await updateChapter(user.uid, bookId, partId, chapterId, {
        title: title.trim(),
        summary: summary.trim()
      });
      
      // Navigate back to the chapter page
      router.push(`/books/${bookId}/parts/${partId}/chapters/${chapterId}`);
    } catch (err) {
      console.error('Error saving chapter:', err);
      setError('Failed to save changes');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/books/${bookId}/parts/${partId}/chapters/${chapterId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !chapter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Edit Chapter
          </h1>
          <p className="text-gray-600">
            Update the title and summary for this chapter
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Chapter Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter chapter title"
              required
            />
          </div>

          {/* Summary Field */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
              Chapter Summary
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter a brief summary of this chapter"
            />
            <p className="mt-2 text-sm text-gray-500">
              A concise overview that describes what this chapter covers
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="flex-1 lg:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 lg:flex-none px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
