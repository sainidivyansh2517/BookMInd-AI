import React from 'react';

export const Badge = ({ children, status, variant = 'default', style = {} }) => {
  const getBadgeStyle = () => {
    if (status === 'currently_reading') {
      return {
        backgroundColor: 'var(--accent-subtle)',
        color: 'var(--accent-primary)',
        border: '1px solid rgba(79, 70, 229, 0.2)'
      };
    }
    if (status === 'completed') {
      return {
        backgroundColor: 'var(--status-success-bg)',
        color: 'var(--status-success)',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      };
    }
    if (status === 'want_to_read') {
      return {
        backgroundColor: 'var(--status-warning-bg)',
        color: 'var(--status-warning)',
        border: '1px solid rgba(245, 158, 11, 0.2)'
      };
    }
    if (variant === 'tag') {
      return {
        backgroundColor: 'var(--bg-surface-subtle)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)'
      };
    }
    return {
      backgroundColor: 'var(--bg-surface-subtle)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-color)'
    };
  };

  const getStatusLabel = () => {
    if (status === 'currently_reading') return 'Currently Reading';
    if (status === 'completed') return 'Completed';
    if (status === 'want_to_read') return 'Want to Read';
    return children;
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        whiteSpace: 'nowrap',
        ...getBadgeStyle(),
        ...style
      }}
    >
      {getStatusLabel()}
    </span>
  );
};
