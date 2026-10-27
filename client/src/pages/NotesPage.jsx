import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, PenSquare } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { NoteCard } from '../components/notes/NoteCard';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonRow } from '../components/ui/Skeleton';
import { NoteEditorModal } from '../components/notes/NoteEditorModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const fetchNotes = async ({ signal }) => {
  const res = await axios.get('/api/notes', { signal });
  return res.data.notes || [];
};

const fetchBooks = async ({ signal }) => {
  const res = await axios.get('/api/books', { signal });
  return res.data.books || [];
};

export const NotesPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: notes = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: ({ signal }) => fetchNotes({ signal }),
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.id,
  });

  const {
    data: books = []
  } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: ({ signal }) => fetchBooks({ signal }),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });

  const showLoading = !user?.id || loading;

  // Client-side filtering across title, content, book title, and tags
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (note.title && note.title.toLowerCase().includes(q)) ||
      (note.content && note.content.toLowerCase().includes(q)) ||
      (note.book?.title && note.book.title.toLowerCase().includes(q)) ||
      (note.tags && note.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const handleOpenCreate = () => {
    setEditingNote(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setModalOpen(true);
  };

  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) {
        await axios.put(`/api/notes/${noteData.id}`, noteData);
        addToast('Note updated successfully!', 'success');
      } else {
        await axios.post('/api/notes', noteData);
        addToast('Note created successfully!', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
      setModalOpen(false);
      setEditingNote(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save note.', 'error');
      throw err;
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await axios.delete(`/api/notes/${noteId}`);
      queryClient.setQueryData(['notes', user?.id], (old = []) => old.filter((n) => (n._id || n.id) !== noteId));
      addToast('Note deleted successfully.', 'info');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete note.', 'error');
    }
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Reading Notes
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {notes.length > 0 ? `${notes.length} notes across your library — your personal knowledge base.` : 'Start capturing ideas from what you read.'}
            </p>
          </div>
          <Button icon={PenSquare} onClick={handleOpenCreate}>
            New Note
          </Button>
        </div>

        {/* Search Bar */}
        <Input
          icon={Search}
          placeholder="Search notes by title, content, book title, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Results Count */}
        {searchQuery && !showLoading && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '-12px' }}>
            {filteredNotes.length === 0 ? 'No results for that search.' : `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''} match "${searchQuery}"`}
          </p>
        )}

        {/* Notes List */}
        {showLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filteredNotes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note._id || note.id}
                note={note}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No notes yet"
            description="Capture quotes, chapter summaries, or personal insights from your books. Build your own knowledge base over time."
            actionLabel="Write First Note"
            onAction={handleOpenCreate}
          />
        )}

      </div>

      <NoteEditorModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingNote(null); }}
        note={editingNote}
        userBooks={books}
        onSave={handleSaveNote}
      />
    </AppShell>
  );
};
