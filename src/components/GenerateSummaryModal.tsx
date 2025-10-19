'use client';

import { useState } from 'react';
import { generateWithAI } from '../lib/ai';

interface GenerateSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  entityType: 'book' | 'part' | 'chapter' | 'section';
  entityTitle: string;
  onGenerated?: (content: string) => void;
}

export default function GenerateSummaryModal({
  isOpen,
  onClose,
  prompt,
  entityType,
  entityTitle,
  onGenerated
}: Readonly<GenerateSummaryModalProps>) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      const result = await generateWithAI({
        prompt,
        entityType,
        entityTitle
      });

      if (result.success && result.content) {
        setGeneratedContent(result.content);
      } else {
        setError(result.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGenerated = () => {
    if (generatedContent && onGenerated) {
      onGenerated(generatedContent);
    }
    onClose();
  };

  const handleClose = () => {
    setGeneratedContent('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl min-h-[80vh] lg:max-h-[80vh] flex flex-col my-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 lg:p-6 pb-3 lg:pb-4 border-b border-gray-200">
          <h2 className="text-lg lg:text-xl font-bold text-gray-800 m-0">
            🤖 Generate AI Summary
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            ❌
          </button>
        </div>

        {/* Entity Info */}
        <div className="bg-gray-50 p-3 lg:p-4 rounded-lg mb-4 mx-4 lg:mx-6">
          <div className="font-semibold text-sm text-gray-700 mb-1">
            {entityType.charAt(0).toUpperCase() + entityType.slice(1)}: {entityTitle}
          </div>
          <div className="text-xs text-gray-500">
            The following prompt will be sent to OpenAI:
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 min-h-48 max-h-96 mx-4 lg:mx-6">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold text-sm text-gray-800">
              Complete OpenAI Prompt:
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(prompt);
                alert('Prompt copied to clipboard!');
              }}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
            >
              📋 Copy
            </button>
          </div>
          <div className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm font-mono leading-relaxed bg-gray-50 text-gray-700 overflow-auto whitespace-pre-wrap select-text cursor-text">
            {prompt || 'No prompt available'}
          </div>
        </div>

        {/* Generated Content */}
        {generatedContent && (
          <div className="mt-5 mx-4 lg:mx-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="m-0 mb-3 text-sm text-blue-600 font-bold">
              🤖 Generated Content:
            </h4>
            <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
              {generatedContent}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-5 mx-4 lg:mx-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="m-0 mb-2 text-sm text-red-600 font-bold">
              ❌ Error:
            </h4>
            <div className="text-sm text-red-600">
              {error}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 mx-4 lg:mx-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 lg:px-5 py-2 lg:py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Cancel
          </button>
          
          {generatedContent ? (
            <button
              type="button"
              onClick={handleUseGenerated}
              className="px-4 lg:px-5 py-2 lg:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              ✅ Use This Content
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={
                isGenerating 
                  ? 'px-4 lg:px-5 py-2 lg:py-2.5 text-white rounded-lg transition-colors text-sm bg-gray-500 cursor-not-allowed opacity-70'
                  : 'px-4 lg:px-5 py-2 lg:py-2.5 text-white rounded-lg transition-colors text-sm bg-blue-600 hover:bg-blue-700 cursor-pointer'
              }
            >
              {isGenerating ? '⏳ Generating...' : '🤖 Generate with AI'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}