'use client';

import { useState } from 'react';
import BookList from '../components/BookList';
import BookEditor from '../components/BookEditor';

export default function Home() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar with book list */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Book Builder</h1>
        </div>
        <BookList 
          userId="temp-user-id" // This will be replaced when you add auth to layout
          onSelectBook={setSelectedBookId}
          selectedBookId={selectedBookId}
        />
      </div>
      
      {/* Main content area */}
      <div style={{ flex: 1, padding: '20px' }}>
        {selectedBookId ? (
          <BookEditor userId="temp-user-id" bookId={selectedBookId} />
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