'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getPartTOC, updatePart } from '@/features/books/data';
import type { Part } from '@/types/book-builder';

export default function EditPartPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const bookId = params.bookId as string;
  const partId = params.partId as string;
  
  const [part, setPart] = useState<Part | null>(null);
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
      loadPart();
    }
  }, [user, authLoading, bookId, partId]);

  const loadPart = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const data = await getPartTOC(user.uid, bookId, partId);
      setPart(data.part);
      setTitle(data.part.title);
      setSummary(data.part.summary || '');
    } catch (err) {
      console.error('Error loading part:', err);
      setError('Failed to load part');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid || !part) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await updatePart(user.uid, bookId, partId, {
        title: title.trim(),
        summary: summary.trim()
      });
      
      // Navigate back to the part page
      router.push(`/books/${bookId}/parts/${partId}`);
    } catch (err) {
      console.error('Error saving part:', err);
      setError('Failed to save changes');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/books/${bookId}/parts/${partId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !part) {
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
            Edit Part
          </h1>
          <p className="text-gray-600">
            Update the title and summary for this part
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Part Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter part title"
              required
            />
          </div>

          {/* Summary Field */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
              Part Summary
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter a brief summary of this part"
            />
            <p className="mt-2 text-sm text-gray-500">
              A concise overview that describes what this part covers
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
