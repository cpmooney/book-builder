import { useState, useEffect } from 'react';
import { 
  getBookTOC, 
  getPartTOC, 
  getChapterSummary, 
  getSectionContent 
} from './data';
import type { Part, Chapter, Section } from '../../types/book-builder';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get book table of contents with live updates
 * @param uid - User ID
 * @param bookId - Book ID
 * @returns Object with parts array, loading state, and error
 */
export function useBookTOC(uid: string, bookId: string): UseDataResult<{ parts: Array<{ part: Part; chapters: Chapter[] }> }> {
  const [data, setData] = useState<{ parts: Array<{ part: Part; chapters: Chapter[] }> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !bookId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getBookTOC(uid, bookId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid, bookId]);

  return { data, loading, error };
}

/**
 * Hook to get part table of contents with live updates
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @returns Object with part data and chapters, loading state, and error
 */
export function usePartTOC(uid: string, bookId: string, partId: string): UseDataResult<{ part: Part; chapters: Chapter[] }> {
  const [data, setData] = useState<{ part: Part; chapters: Chapter[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !bookId || !partId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getPartTOC(uid, bookId, partId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid, bookId, partId]);

  return { data, loading, error };
}

/**
 * Hook to get chapter summary with sections
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @returns Object with chapter data and sections, loading state, and error
 */
export function useChapterSummary(uid: string, bookId: string, partId: string, chapterId: string): UseDataResult<{ chapter: Chapter; sections: Section[] }> {
  const [data, setData] = useState<{ chapter: Chapter; sections: Section[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !bookId || !partId || !chapterId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getChapterSummary(uid, bookId, partId, chapterId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid, bookId, partId, chapterId]);

  return { data, loading, error };
}

/**
 * Hook to get section content with concatenated block text
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @param sectionId - Section ID
 * @returns Object with section data and contentText, loading state, and error
 */
export function useSectionContent(uid: string, bookId: string, partId: string, chapterId: string, sectionId: string): UseDataResult<{ section: Section; contentText: string }> {
  const [data, setData] = useState<{ section: Section; contentText: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !bookId || !partId || !chapterId || !sectionId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getSectionContent(uid, bookId, partId, chapterId, sectionId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid, bookId, partId, chapterId, sectionId]);

  return { data, loading, error };
}