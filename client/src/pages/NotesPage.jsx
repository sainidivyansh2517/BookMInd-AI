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

const fetchNotes = async ({ signal }) => {
  const res = await axios.get('/api/notes', { signal });
  return res.data.notes || [];
};

export const NotesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: notes = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['notes'],
    queryFn: ({ signal }) => fetchNotes({ signal }),
    staleTime: 2 * 60 * 1000,
  });

  // Client-side filtering — notes already in cache
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (note.content && note.content.toLowerCase().includes(q)) ||
      (note.chapter && note.chapter.toLowerCase().includes(q)) ||
      (note.book?.title && note.book.title.toLowerCase().includes(q)) ||
      (note.tags && note.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const handleNoteCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  }, [queryClient]);

  const handleNoteDeleted = useCallback((noteId) => {
    // Optimistic update — remove from cache immediately
    queryClient.setQueryData(['notes'], (old = []) => old.filter((n) => (n._id || n.id) !== noteId));
  }, [queryClient]);

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
          <Button icon={PenSquare} onClick={() => setCreateModalOpen(true)}>
            New Note
          </Button>
        </div>

        {/* Search Bar */}
        <Input
          icon={Search}
          placeholder="Search notes by content, chapter, book title, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Results Count */}
        {searchQuery && !loading && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '-12px' }}>
            {filteredNotes.length === 0 ? 'No results for that search.' : `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''} match "${searchQuery}"`}
          </p>
        )}

        {/* Notes List */}
        {loading ? (
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
                onDeleted={() => handleNoteDeleted(note._id || note.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No notes yet"
            description="Capture quotes, chapter summaries, or personal insights from your books. Build your own knowledge base over time."
            actionLabel="Write First Note"
            onAction={() => setCreateModalOpen(true)}
          />
        )}

      </div>

      <NoteEditorModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleNoteCreated}
      />
    </AppShell>
  );
};
