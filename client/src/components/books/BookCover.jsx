import React, { useState } from 'react';
import { Book } from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
  'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
  'linear-gradient(135deg, #701a75 0%, #4a044e 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)',
  'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)'
];

export const BookCover = ({ coverUrl, title = 'Untitled', authors = [], aspectRatio = '3/4', width = '100%', height }) => {
  const [imageError, setImageError] = useState(false);

  // Hash title to pick consistent fallback gradient
  const getGradientIndex = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % GRADIENTS.length;
  };

  const authorName = Array.isArray(authors) ? authors.join(', ') : (authors || 'Unknown Author');
  const gradient = GRADIENTS[getGradientIndex(title)];

  if (!coverUrl || imageError) {
    return (
      <div
        style={{
          width,
          height: height || '100%',
          aspectRatio,
          background: gradient,
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.7 }}>
          <Book size={16} />
          <span style={{ fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase' }}>BookMind</span>
        </div>
        <div style={{ margin: 'auto 0' }}>
          <h4
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: '6px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {title}
          </h4>
          <p
            style={{
              fontSize: '0.75rem',
              opacity: 0.8,
              fontWeight: 400,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {authorName}
          </p>
        </div>
        <div style={{ height: '3px', width: '30%', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: '2px' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        width,
        height: height || '100%',
        aspectRatio,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        backgroundColor: 'var(--bg-surface-subtle)'
      }}
    >
      <img
        src={coverUrl}
        alt={`Cover of ${title}`}
        onError={() => setImageError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </div>
  );
};
