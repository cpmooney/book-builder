'use client';

import { useState, useEffect } from 'react';
import BookList from '../components/BookList';
import BookEditor from '../components/BookEditor';
import { getFirebaseUserId } from '@/lib/firebase-user';

export default function Home() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await getFirebaseUserId();
        setUserId(id);
      } catch (error) {
        console.error('Error getting user ID:', error);
        // User is not authenticated, redirect to sign-in
        globalThis.location.href = '/sign-in';
      } finally {
        setLoading(false);
      }
    };

    loadUserId();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    return <div>Redirecting to sign-in...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar with book list */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Book Builder</h1>
        </div>
        <BookList
          userId={userId}
          onSelectBook={setSelectedBookId}
          selectedBookId={selectedBookId}
        />
      </div>
      
      {/* Main content area */}
      <div style={{ flex: 1, padding: '20px' }}>
        {selectedBookId ? (
          <BookEditor userId={userId} bookId={selectedBookId} />
        ) : (
          <div>
            <h2>Select a book to edit</h2>
            <p>Choose a book from the sidebar to start editing its contents.</p>
          </div>
        )}
      </div>
    </div>
  );
}