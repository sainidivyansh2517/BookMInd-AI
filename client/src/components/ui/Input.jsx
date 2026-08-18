import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  style = {},
  containerStyle = {},
  ...props
}, ref) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...containerStyle }}>
      {label && (
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <span style={{
            position: 'absolute',
            left: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <Icon size={18} />
          </span>
        )}
        <input
          ref={ref}
          style={{
            width: '100%',
            height: '42px',
            paddingLeft: Icon ? '40px' : '14px',
            paddingRight: '14px',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: `1px solid ${error ? 'var(--status-danger)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            ...style
          }}
          {...props}
        />
      </div>
      {error ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)' }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{helperText}</span>
      ) : null}
    </div>
  );
});
