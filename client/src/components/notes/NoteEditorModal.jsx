import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export const NoteEditorModal = ({ isOpen, onClose, note, userBooks = [], onSave }) => {
  const [title, setTitle] = useState('');
  const [bookId, setBookId] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setBookId(note.bookId || note.book?.id || '');
      setTags(note.tags ? note.tags.join(', ') : '');
      setContent(note.content || '');
    } else {
      setTitle('');
      setBookId('');
      setTags('');
      setContent('');
    }
  }, [note, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: note ? (note._id || note.id) : null,
        title: title.trim(),
        bookId: bookId || null,
        tags,
        content: content.trim()
      });
      onClose();
    } catch (err) {
      // Error handled by parent toast
    } finally {
      setSaving(false);
    }
  };

  const bookOptions = [
    { value: '', label: 'None (Standalone Note)' },
    ...userBooks.map((b) => ({
      value: b._id || b.id,
      label: `${b.title} (${(b.authors && b.authors[0]) || 'Author'})`
    }))
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={note ? 'Edit Note' : 'Create New Note'}
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Note Title"
          placeholder="e.g. Identity-Based Habits & Systems"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Select
            label="Associate with Book"
            options={bookOptions}
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
          />

          <Input
            label="Tags (comma-separated)"
            placeholder="habits, productivity, identity"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            Note Content
          </label>
          <textarea
            placeholder="Capture your thoughts, quotes, reflections, and key takeaways..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            required
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              fontFamily: 'var(--font-serif)',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            {note ? 'Save Changes' : 'Create Note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
