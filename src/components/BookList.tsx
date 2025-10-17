'use client';

import { useState, useEffect } from 'react';
import { createBook } from '../features/books/data';

interface BookListProps {
  userId: string;
  onSelectBook: (bookId: string) => void;
  selectedBookId: string | null;
}

interface Book {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
}

// Mock book data - will be replaced with real Firestore data
const mockBooks: Book[] = [
  { id: 'book1', title: 'My First Book', status: 'draft' },
  { id: 'book2', title: 'Advanced Topics', status: 'published' },
  { id: 'book3', title: 'Work in Progress', status: 'draft' },
];

export default function BookList({ userId, onSelectBook, selectedBookId }: Readonly<BookListProps>) {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateBook = async () => {
    if (newBookTitle.trim() && !creating) {
      setCreating(true);
      try {
        const bookRef = await createBook(userId, {
          title: newBookTitle.trim(),
          status: 'draft'
        });
        
        // Add to local state (in real app, this would come from a subscription)
        const newBook: Book = {
          id: bookRef.id,
          title: newBookTitle.trim(),
          status: 'draft'
        };
        setBooks(prev => [...prev, newBook]);
        
        setNewBookTitle('');
        setShowCreateForm(false);
      } catch (error) {
        console.error('Error creating book:', error);
      } finally {
        setCreating(false);
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Books</h2>
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + New Book
          </button>
        ) : (
          <div style={{ marginTop: '10px' }}>
            <input
              type="text"
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              placeholder="Book title"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <div>
              <button
                onClick={handleCreateBook}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewBookTitle('');
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => onSelectBook(book.id)}
            style={{
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '8px',
              cursor: 'pointer',
              backgroundColor: selectedBookId === book.id ? '#e3f2fd' : 'white',
              borderColor: selectedBookId === book.id ? '#2196f3' : '#ddd'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{book.title}</div>
            <div style={{ fontSize: '0.85em', color: '#666' }}>
              Status: {book.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}