import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, Plus, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { BookCover } from './BookCover';
import { useToast } from '../../context/ToastContext';

export const BookSearchModal = ({ isOpen, onClose, onBookAdded }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [addedMap, setAddedMap] = useState({});
  const { addToast } = useToast();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/books/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data.results || []);
      } catch (err) {
        addToast('Failed to search OpenLibrary.', 'error');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, addToast]);

  const handleAddBook = async (book, status = 'want_to_read') => {
    try {
      const bookKey = book.openLibraryId || book.title;
      setAddingId(bookKey);

      await axios.post('/api/books', {
        openLibraryId: book.openLibraryId,
        title: book.title,
        authors: book.authors,
        coverUrl: book.coverUrl,
        publishYear: book.publishYear,
        totalPages: book.totalPages || 250,
        genres: book.genres,
        status
      });

      setAddedMap((prev) => ({ ...prev, [bookKey]: true }));
      addToast(`"${book.title}" added to your library!`, 'success');
      if (onBookAdded) onBookAdded();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not add book to library.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search & Add Books" maxWidth="640px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          icon={Search}
          placeholder="Search by title, author, ISBN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div style={{ minHeight: '300px', maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px', color: 'var(--text-secondary)' }}>
              <Loader2 className="animate-spin" size={20} />
              <span>Searching OpenLibrary...</span>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '0.875rem' }}>
              {query ? 'No books found on OpenLibrary for this query.' : 'Type a book title or author above to search OpenLibrary.'}
            </div>
          ) : (
            results.map((book, idx) => {
              const bookKey = book.openLibraryId || book.title;
              const isAdded = addedMap[bookKey];
              const isAdding = addingId === bookKey;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ width: '44px', flexShrink: 0 }}>
                    <BookCover coverUrl={book.coverUrl} title={book.title} authors={book.authors} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {book.title}
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}
                      {book.publishYear ? ` • ${book.publishYear}` : ''}
                    </p>
                  </div>

                  {isAdded ? (
                    <Button variant="secondary" size="sm" disabled icon={Check}>
                      In Library
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      isLoading={isAdding}
                      icon={Plus}
                      onClick={() => handleAddBook(book)}
                    >
                      Add Book
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
