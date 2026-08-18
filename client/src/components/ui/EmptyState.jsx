import React from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = BookOpen,
  title = 'No items found',
  description = 'Start building your reading space by adding books or notes.',
  actionLabel,
  onAction
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px border-dashed var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        maxWidth: '460px',
        margin: '24px auto'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: '16px'
        }}
      >
        <Icon size={28} />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: actionLabel ? '20px' : 0
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};
