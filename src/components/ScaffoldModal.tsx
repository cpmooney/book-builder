'use client';

import { useState } from 'react';
import { scaffoldChildren, type ScaffoldItem, type ChildEntityType } from '@/lib/ai';

interface ScaffoldModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onScaffold: (items: ScaffoldItem[]) => void;
  readonly parentTitle: string;
  readonly childType: ChildEntityType;
}

export default function ScaffoldModal({
  isOpen,
  onClose,
  onScaffold,
  parentTitle,
  childType
}: ScaffoldModalProps) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScaffoldItem[] | null>(null);

  if (!isOpen) return null;

  const childTypeLabel = childType.charAt(0).toUpperCase() + childType.slice(1);
  const childTypeLabelPlural = `${childTypeLabel}s`;

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please enter some content to scaffold');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPreview(null);

    try {
      const result = await scaffoldChildren({
        content: content.trim(),
        childType,
        parentTitle
      });

      if (result.success && result.items) {
        setPreview(result.items);
      } else {
        setError(result.error || 'Failed to scaffold content');
      }
    } catch (err) {
      console.error('Scaffold error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUse = () => {
    if (preview) {
      onScaffold(preview);
      handleClose();
    }
  };

  const handleClose = () => {
    setContent('');
    setPreview(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl min-h-[90vh] lg:max-h-[90vh] flex flex-col my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              🏗️ Scaffold {childTypeLabelPlural}
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 mt-1">
              Convert loose content into structured {childTypeLabelPlural.toLowerCase()} for "{parentTitle}"
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            ❌
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-full">
            {/* Input Section */}
            <div className="p-4 lg:p-6 lg:border-r border-gray-200 flex flex-col">
              <div className="mb-4">
                <label htmlFor="scaffold-content" className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Loose Content
                </label>
                <textarea
                  id="scaffold-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-48 lg:h-64 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter your loose content here...

For example:
1. Introduction
Basic overview and getting started...

2. Advanced Topics  
Deep dive into complex concepts...

3. Conclusion
Wrap up and next steps...`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !content.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      🤖 Generate Structure
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span>
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="p-4 lg:p-6 flex flex-col border-t lg:border-t-0 border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  👀 Preview {childTypeLabelPlural}
                </h3>
                {preview && (
                  <p className="text-sm text-gray-600">
                    {preview.length} {preview.length === 1 ? childType : childTypeLabelPlural.toLowerCase()} generated
                  </p>
                )}
              </div>

              <div className="flex-1 min-h-48 overflow-y-auto">
                {preview === null ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🤖</div>
                      <p>Generated {childTypeLabelPlural.toLowerCase()} will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {preview.map((item, index) => (
                      <div key={`${item.title}-${index}`} className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {index + 1}. {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {preview && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      🔄 Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={handleUse}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ✅ Create {preview.length} {preview.length === 1 ? childType : childTypeLabelPlural}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}