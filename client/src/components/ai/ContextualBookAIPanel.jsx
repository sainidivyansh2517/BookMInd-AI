import React from 'react';
import { Sparkles } from 'lucide-react';
import { AIChat } from './AIChat';

export const ContextualBookAIPanel = ({ book }) => {
  if (!book) return null;

  const bookId = book._id || book.id;
  const suggestedPrompts = [
    `Summarize my notes on "${book.title}"`,
    `What are the core lessons from this book?`,
    `What should I read next after "${book.title}"?`,
    `Help me write a concise review of this book`
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: 'var(--bg-surface-subtle)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={20} color="var(--accent-primary)" />
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Ask BookMind about "{book.title}"
        </h3>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Query your personal notes, request custom summaries, or analyze themes specific to this book.
      </p>

      <div style={{ height: '420px' }}>
        <AIChat bookId={bookId} suggestedPrompts={suggestedPrompts} />
      </div>
    </div>
  );
};
