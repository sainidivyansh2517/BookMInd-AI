import React, { useState } from 'react';
import { Search, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { BookSearchModal } from '../books/BookSearchModal';

export const Topbar = ({ onBookAdded }) => {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-main)',
          gap: '16px'
        }}
        className="topbar-desktop"
      >
        <button
          onClick={() => setSearchModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            width: '320px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <Search size={16} />
          <span>Search OpenLibrary or your books...</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" icon={Sparkles} onClick={() => navigate('/ai')}>
            Ask BookMind AI
          </Button>

          <Button size="sm" icon={Plus} onClick={() => setSearchModalOpen(true)}>
            Add Book
          </Button>
        </div>
      </header>

      <BookSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onBookAdded={onBookAdded}
      />
    </>
  );
};
