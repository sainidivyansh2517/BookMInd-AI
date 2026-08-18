import React from 'react';
import { BookOpen, Tag, Calendar, Edit3, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const NoteCard = ({ note, onEdit, onDelete }) => {
  const formattedDate = note.updatedAt || note.createdAt
    ? new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px',
        gap: '12px',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.4
          }}
        >
          {note.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {onEdit && (
            <button
              onClick={() => onEdit(note)}
              style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: 'var(--radius-sm)' }}
              title="Edit Note"
            >
              <Edit3 size={15} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(note._id || note.id)}
              style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: 'var(--radius-sm)' }}
              title="Delete Note"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {note.content}
      </p>

      {note.tags && note.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {note.tags.map((tag, idx) => (
            <Badge key={idx} variant="tag">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {note.book ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <BookOpen size={13} />
            {note.book.title}
          </span>
        ) : (
          <span>General Note</span>
        )}

        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} />
          {formattedDate}
        </span>
      </div>
    </div>
  );
};
