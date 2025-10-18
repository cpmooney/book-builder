'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBook, listBooks } from '../../features/books/data';
import { useAuth } from '../../components/AuthProvider';

interface Book {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  summary?: string;
}

export default function BooksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookDescription, setNewBookDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const loadBooks = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        const userBooks = await listBooks(user.uid);
        setBooks(userBooks);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [user?.uid]);

  const handleCreateBook = async () => {
    if (!newBookTitle.trim() || creating || !user?.uid) return;
    
    setCreating(true);
    try {
      await createBook(user.uid, {
        title: newBookTitle.trim(),
        summary: newBookDescription.trim() || undefined,
        status: 'draft'
      });
      
      // Reload books
      const userBooks = await listBooks(user.uid);
      setBooks(userBooks);
      
      // Reset form
      setNewBookTitle('');
      setNewBookDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating book:', error);
      alert('Error creating book');
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading books...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Book Builder</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Manage your books and their content structure.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {!showCreateForm ? (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + New Book
          </button>
        ) : (
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#f9f9f9',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginTop: 0 }}>Create New Book</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontWeight: '500' 
              }}>
                Title *
              </label>
              <input
                type="text"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter book title"
                disabled={creating}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontWeight: '500' 
              }}>
                Description
              </label>
              <textarea
                value={newBookDescription}
                onChange={(e) => setNewBookDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
                placeholder="Enter book description (optional)"
                disabled={creating}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCreateBook}
                disabled={!newBookTitle.trim() || creating}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: creating || !newBookTitle.trim() ? 'not-allowed' : 'pointer',
                  opacity: creating || !newBookTitle.trim() ? 0.6 : 1,
                  fontSize: '14px'
                }}
              >
                {creating ? 'Creating...' : 'Create Book'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewBookTitle('');
                  setNewBookDescription('');
                }}
                disabled={creating}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1,
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2>Your Books</h2>
        {books.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  ':hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#333',
                    fontSize: '18px'
                  }}>
                    {book.title}
                  </h3>
                  {book.summary && (
                    <p style={{ 
                      color: '#666', 
                      fontSize: '14px', 
                      margin: '0 0 12px 0',
                      lineHeight: '1.4'
                    }}>
                      {book.summary}
                    </p>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: book.status === 'draft' ? '#ffc107' : '#28a745',
                      color: 'white',
                      borderRadius: '12px',
                      textTransform: 'capitalize'
                    }}>
                      {book.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>
            No books yet. Create your first book to get started!
          </p>
        )}
      </div>
    </div>
  );
}