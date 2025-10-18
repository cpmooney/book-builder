'use client';

import { useState, useEffect } from 'react';
import { createBook, listBooks } from '../features/books/data';

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

export default function BookList({ userId, onSelectBook, selectedBookId }: Readonly<BookListProps>) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Load books when component mounts or userId changes
  useEffect(() => {
    const loadBooks = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const userBooks = await listBooks(userId);
        setBooks(userBooks);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [userId]);

  const handleCreateBook = async () => {
    if (newBookTitle.trim() && !creating) {
      setCreating(true);
      try {
        await createBook(userId, {
          title: newBookTitle.trim(),
          status: 'draft'
        });
        
        // Reload books to get the freshly created book
        const userBooks = await listBooks(userId);
        setBooks(userBooks);
        
        setNewBookTitle('');
        setShowCreateForm(false);
      } catch (error) {
        console.error('Error creating book:', error);
      } finally {
        setCreating(false);
      }
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Books</h2>
        <p>Loading books...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Books</h2>
        {!showCreateForm ? (
          <button
            type="button"
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
                type="button"
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
                type="button"
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
          <button
            type="button"
            key={book.id}
            onClick={() => onSelectBook(book.id)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '8px',
              cursor: 'pointer',
              backgroundColor: selectedBookId === book.id ? '#e3f2fd' : 'white',
              borderColor: selectedBookId === book.id ? '#2196f3' : '#ddd',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{book.title}</div>
            <div style={{ fontSize: '0.85em', color: '#666' }}>
              Status: {book.status}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}