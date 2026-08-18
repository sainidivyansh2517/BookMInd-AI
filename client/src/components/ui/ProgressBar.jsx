import React from 'react';

export const ProgressBar = ({ value = 0, max = 100, height = '8px', showPercent = false }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / (max || 1)) * 100)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <div
        style={{
          width: '100%',
          height: height,
          backgroundColor: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: 'var(--accent-primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease'
          }}
        />
      </div>
      {showPercent && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
          {percentage}%
        </span>
      )}
    </div>
  );
};
