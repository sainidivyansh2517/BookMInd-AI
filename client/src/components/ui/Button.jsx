import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'ghost', 'danger', 'outline'
  size = 'md', // 'sm', 'md', 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  style = {},
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-surface-subtle)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)'
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)'
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: 'none'
        };
      case 'danger':
        return {
          backgroundColor: 'var(--status-danger)',
          color: '#FFFFFF',
          border: 'none'
        };
      case 'primary':
      default:
        return {
          backgroundColor: 'var(--accent-primary)',
          color: '#FFFFFF',
          border: 'none'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '0.8125rem', height: '32px' };
      case 'lg':
        return { padding: '12px 24px', fontSize: '1rem', height: '48px' };
      case 'md':
      default:
        return { padding: '9px 18px', fontSize: '0.875rem', height: '40px' };
    }
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
    opacity: (disabled || isLoading) ? 0.6 : 1,
    pointerEvents: (disabled || isLoading) ? 'none' : 'auto',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style
  };

  return (
    <button style={baseStyle} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" style={{ marginRight: children ? '8px' : 0 }} />
      ) : Icon ? (
        <Icon size={16} style={{ marginRight: children ? '8px' : 0 }} />
      ) : null}
      {children}
    </button>
  );
};
