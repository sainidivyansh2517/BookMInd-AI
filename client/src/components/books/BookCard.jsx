import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCover } from './BookCover';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

export const BookCard = ({ book, layout = 'grid' }) => {
  const navigate = useNavigate();

  const id = book._id || book.id;
  const authorText = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown Author');
  const totalPages = book.totalPages || 250;
  const progressPages = book.progressPages || 0;
  const percent = Math.min(100, Math.round((progressPages / (totalPages || 1)) * 100));

  if (layout === 'list') {
    return (
      <div
        onClick={() => navigate(`/books/${id}`)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        }}
      >
        <div style={{ width: '48px', flexShrink: 0 }}>
          <BookCover coverUrl={book.coverUrl} title={book.title} authors={book.authors} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {book.title}
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{authorText}</p>
        </div>
        <div style={{ width: '130px' }}>
          <Badge status={book.status} />
        </div>
        <div style={{ width: '120px' }}>
          <ProgressBar value={progressPages} max={totalPages} showPercent />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/books/${id}`)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px',
        cursor: 'pointer',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        gap: '12px'
      }}
    >
      <div style={{ width: '100%' }}>
        <BookCover coverUrl={book.coverUrl} title={book.title} authors={book.authors} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h4
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {book.title}
          </h4>
        </div>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {authorText}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Badge status={book.status} />
          {book.status === 'currently_reading' && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {percent}%
            </span>
          )}
        </div>

        {book.status === 'currently_reading' && (
          <ProgressBar value={progressPages} max={totalPages} />
        )}
      </div>
    </div>
  );
};
