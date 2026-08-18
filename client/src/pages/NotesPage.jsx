import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Tag, BookOpen, FileText } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteEditorModal } from '../components/notes/NoteEditorModal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';

export const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    fetchNotesAndBooks();
  }, [selectedBookId, selectedTag]);

  const fetchNotesAndBooks = async () => {
    try {
      setLoading(true);
      const [notesRes, booksRes] = await Promise.all([
        axios.get('/api/notes', {
          params: { bookId: selectedBookId, tag: selectedTag }
        }),
        axios.get('/api/books')
      ]);

      setNotes(notesRes.data.notes || []);
      setUserBooks(booksRes.data.books || []);
    } catch (err) {
      addToast('Failed to fetch notes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) {
        await axios.put(`/api/notes/${noteData.id}`, noteData);
        addToast('Note updated successfully!', 'success');
      } else {
        await axios.post('/api/notes', noteData);
        addToast('Note created successfully!', 'success');
      }
      fetchNotesAndBooks();
    } catch (err) {
      addToast('Failed to save note.', 'error');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`/api/notes/${noteId}`);
      addToast('Note deleted.', 'info');
      fetchNotesAndBooks();
    } catch (err) {
      addToast('Could not delete note.', 'error');
    }
  };

  const bookFilterOptions = [
    { value: '', label: 'All Books & Standalone Notes' },
    ...userBooks.map((b) => ({ value: b._id || b.id, label: b.title }))
  ];

  return (
    <AppShell onBookAdded={fetchNotesAndBooks}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Your Notes Workspace
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Capture ideas worth remembering and build your personal reading knowledge base.
            </p>
          </div>
          <Button
            icon={Plus}
            onClick={() => {
              setEditingNote(null);
              setEditorOpen(true);
            }}
          >
            Create Note
          </Button>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px'
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Input
              icon={Search}
              placeholder="Search notes by keyword or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ width: '240px' }}>
            <Select
              options={bookFilterOptions}
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
            />
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading notes...
          </div>
        ) : filteredNotes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note._id || note.id}
                note={note}
                onEdit={(n) => {
                  setEditingNote(n);
                  setEditorOpen(true);
                }}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No notes captured yet"
            description="Capture your first idea, quote, or reflection from what you are currently reading."
            actionLabel="Create a Note"
            onAction={() => {
              setEditingNote(null);
              setEditorOpen(true);
            }}
          />
        )}

      </div>

      <NoteEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        note={editingNote}
        userBooks={userBooks}
        onSave={handleSaveNote}
      />
    </AppShell>
  );
};
