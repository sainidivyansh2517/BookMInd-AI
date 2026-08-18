import React from 'react';

export const SkeletonCard = () => (
  <div
    style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}
  >
    <div className="skeleton-pulse" style={{ height: '220px', width: '100%', borderRadius: 'var(--radius-md)' }} />
    <div className="skeleton-pulse" style={{ height: '18px', width: '75%' }} />
    <div className="skeleton-pulse" style={{ height: '14px', width: '50%' }} />
    <div className="skeleton-pulse" style={{ height: '8px', width: '100%', marginTop: '8px' }} />
  </div>
);

export const SkeletonRow = () => (
  <div
    style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}
  >
    <div className="skeleton-pulse" style={{ width: '48px', height: '64px', borderRadius: 'var(--radius-sm)' }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="skeleton-pulse" style={{ height: '18px', width: '40%' }} />
      <div className="skeleton-pulse" style={{ height: '14px', width: '25%' }} />
    </div>
  </div>
);
