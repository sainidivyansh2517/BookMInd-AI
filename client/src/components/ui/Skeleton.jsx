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

/** Full-page skeleton shown during React.lazy() Suspense fallback */
export const PageSkeleton = () => (
  <div
    style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      display: 'flex'
    }}
  >
    {/* Sidebar skeleton */}
    <div
      style={{
        width: '240px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div className="skeleton-pulse" style={{ height: '36px', width: '80%', borderRadius: 'var(--radius-md)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-pulse" style={{ height: '38px', width: '100%', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    </div>

    {/* Main content skeleton */}
    <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton-pulse" style={{ height: '32px', width: '260px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton-pulse" style={{ height: '16px', width: '200px', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="skeleton-pulse" style={{ height: '40px', width: '140px', borderRadius: 'var(--radius-full)' }} />
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}
          >
            <div className="skeleton-pulse" style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="skeleton-pulse" style={{ height: '14px', width: '60%' }} />
              <div className="skeleton-pulse" style={{ height: '26px', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  </div>
);
