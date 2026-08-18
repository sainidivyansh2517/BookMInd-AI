import React from 'react';
import { Star } from 'lucide-react';

export const Rating = ({ value = 0, onChange, readonly = false, size = 16 }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {stars.map((star) => {
        const isFilled = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange && onChange(star)}
            style={{
              padding: '2px',
              cursor: readonly ? 'default' : 'pointer',
              color: isFilled ? 'var(--status-warning)' : 'var(--border-color)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Star size={size} fill={isFilled ? 'var(--status-warning)' : 'none'} />
          </button>
        );
      })}
    </div>
  );
};
