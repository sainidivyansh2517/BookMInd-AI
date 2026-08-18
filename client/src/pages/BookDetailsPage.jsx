import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  FileText, 
  Trash2, 
  Edit3, 
  Check, 
  BookOpen, 
  Calendar, 
  Tag, 
  Sparkles, 
  Plus 
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Rating } from '../components/ui/Rating';
import { ProgressBar } from '../components/ui/ProgressBar';
import { BookCover } from '../components/books/BookCover';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteEditorModal } from '../components/notes/NoteEditorModal';
import { ContextualBookAIPanel } from '../components/ai/ContextualBookAIPanel';
import { useToast } from '../context/ToastContext';

export const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [book, setBook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit progress state
  const [progressPages, setProgressPages] = useState(0);
  const [totalPages, setTotalPages] = useState(250);
  const [status, setStatus] = useState('want_to_read');
  const [rating, setRating] = useState(0);
  const [updating, setUpdating] = useState(false);

  // Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/books/${id}`);
      const b = res.data.book;
      setBook(b);
      setNotes(res.data.notes || []);

      setProgressPages(b.progressPages || 0);
      setTotalPages(b.totalPages || 250);
      setStatus(b.status || 'want_to_read');
      setRating(b.rating || 0);
    } catch (err) {
      addToast('Failed to load book details.', 'error');
      navigate('/books');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBook = async (newFields = {}) => {
    setUpdating(true);
    try {
      const res = await axios.put(`/api/books/${id}`, {
        progressPages: newFields.progressPages !== undefined ? newFields.progressPages : progressPages,
        totalPages: newFields.totalPages !== undefined ? newFields.totalPages : totalPages,
        status: newFields.status || status,
        rating: newFields.rating !== undefined ? newFields.rating : rating
      });

      const updated = res.data.book;
      setBook(updated);
      setProgressPages(updated.progressPages);
      setStatus(updated.status);
      setRating(updated.rating);
      addToast('Book updated successfully.', 'success');
    } catch (err) {
      addToast('Could not update book progress.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!window.confirm(`Are you sure you want to remove "${book.title}" from your library?`)) {
      return;
    }

    try {
      await axios.delete(`/api/books/${id}`);
      addToast(`"${book.title}" removed from library.`, 'info');
      navigate('/books');
    } catch (err) {
      addToast('Failed to delete book.', 'error');
    }
  };

  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) {
        await axios.put(`/api/notes/${noteData.id}`, noteData);
      } else {
        await axios.post('/api/notes', { ...noteData, bookId: id });
      }
      addToast('Note saved successfully!', 'success');
      fetchBookDetails();
    } catch (err) {
      addToast('Failed to save note.', 'error');
    }
  };

  if (loading || !book) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          Loading book details...
        </div>
      </AppShell>
    );
  }

  const percent = Math.min(100, Math.round((progressPages / (totalPages || 1)) * 100));

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <div>
          <button
            onClick={() => navigate('/books')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} />
            Back to Library
          </button>
        </div>

        {/* Hero Book Details Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Cover */}
          <div style={{ width: '100%', maxWidth: '220px', margin: '0 auto' }}>
            <BookCover coverUrl={book.coverUrl} title={book.title} authors={book.authors} height="300px" />
          </div>

          {/* Info & Interactive Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Badge status={status} />
                {book.publishYear && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Published {book.publishYear}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: '6px' }}>
                {book.title}
              </h1>

              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                By {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rating:</span>
                <Rating
                  value={rating}
                  onChange={(newRating) => {
                    setRating(newRating);
                    handleUpdateBook({ rating: newRating });
                  }}
                />
              </div>
            </div>

            {/* Reading Status & Progress Input Controls */}
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Reading Status</span>
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setStatus(newStatus);
                    handleUpdateBook({ status: newStatus });
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}
                >
                  <option value="want_to_read">Want to Read</option>
                  <option value="currently_reading">Currently Reading</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>Progress ({progressPages} of {totalPages} pages)</span>
                  <span style={{ fontWeight: 600 }}>{percent}%</span>
                </div>
                <ProgressBar value={progressPages} max={totalPages} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Page:</span>
                <input
                  type="number"
                  min={0}
                  max={totalPages}
                  value={progressPages}
                  onChange={(e) => setProgressPages(Number(e.target.value))}
                  style={{
                    width: '90px',
                    padding: '6px 10px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem'
                  }}
                />
                <Button size="sm" variant="secondary" isLoading={updating} onClick={() => handleUpdateBook()}>
                  Save Progress
                </Button>
              </div>
            </div>

            {/* Action CTAs */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button icon={Plus} onClick={() => setNoteModalOpen(true)}>
                Add Note
              </Button>
              <Button variant="danger" icon={Trash2} onClick={handleDeleteBook}>
                Remove Book
              </Button>
            </div>
          </div>
        </div>

        {/* Section 1: About This Book */}
        {book.description && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              About this Book
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {book.description}
            </p>
          </div>
        )}

        {/* Section 2: Notes on this Book */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Your Notes on "{book.title}" ({notes.length})
            </h3>
            <Button size="sm" icon={Plus} onClick={() => setNoteModalOpen(true)}>
              New Note
            </Button>
          </div>

          {notes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {notes.map((note) => (
                <NoteCard key={note._id || note.id} note={{ ...note, book }} />
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', backgroundColor: 'var(--bg-surface)', border: '1px border-dashed var(--border-color)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                You haven't added any notes for this book yet.
              </p>
              <Button size="sm" icon={Plus} onClick={() => setNoteModalOpen(true)}>
                Add First Note
              </Button>
            </div>
          )}
        </div>

        {/* Section 3: Contextual AI Assistant Panel */}
        <ContextualBookAIPanel book={book} />

      </div>

      <NoteEditorModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        userBooks={[book]}
        onSave={handleSaveNote}
      />
    </AppShell>
  );
};
