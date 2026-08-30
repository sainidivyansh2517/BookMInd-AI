import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { BookCard } from '../components/books/BookCard';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { BookSearchModal } from '../components/books/BookSearchModal';
import { useToast } from '../context/ToastContext';

const fetchLibrary = async ({ statusFilter, sortBy, signal }) => {
  const res = await axios.get('/api/books', {
    params: { status: statusFilter, sort: sortBy },
    signal
  });
  return res.data.books || [];
};

export const LibraryPage = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: books = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['books', statusFilter, sortBy],
    queryFn: ({ signal }) => fetchLibrary({ statusFilter, sortBy, signal }),
    staleTime: 2 * 60 * 1000,
  });

  // Client-side search filtering (books already fetched)
  const filteredBooks = books.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.authors && b.authors.some((a) => a.toLowerCase().includes(q))) ||
      (b.genres && b.genres.some((g) => g.toLowerCase().includes(q)))
    );
  });

  const handleBookAdded = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
  }, [queryClient]);

  const filterTabs = [
    { id: 'all', label: 'All Books' },
    { id: 'currently_reading', label: 'Currently Reading' },
    { id: 'want_to_read', label: 'Want to Read' },
    { id: 'completed', label: 'Completed' }
  ];

  const sortOptions = [
    { value: 'recent', label: 'Recently Added' },
    { value: 'title', label: 'Title (A-Z)' },
    { value: 'author', label: 'Author Name' },
    { value: 'rating', label: 'Highest Rating' }
  ];

  return (
    <AppShell onBookAdded={handleBookAdded}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              My Library
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Your personal collection of books, reading progress, and saved knowledge.
            </p>
          </div>
          <Button icon={Plus} onClick={() => setSearchModalOpen(true)}>
            Add Book to Library
          </Button>
        </div>

        {/* Filter Bar & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: statusFilter === tab.id ? 600 : 500, backgroundColor: statusFilter === tab.id ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)', color: statusFilter === tab.id ? '#FFFFFF' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all var(--transition-fast)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search, Sort, View Toggle */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <Input
                icon={Search}
                placeholder="Search by title, author, genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ width: '180px' }}>
              <Select options={sortOptions} value={sortBy} onChange={(e) => setSortBy(e.target.value)} />
            </div>

            {/* Grid / List Toggle */}
            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{ padding: '8px 12px', backgroundColor: viewMode === 'grid' ? 'var(--accent-subtle)' : 'transparent', color: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{ padding: '8px 12px', backgroundColor: viewMode === 'list' ? 'var(--accent-subtle)' : 'transparent', color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Books List / Grid View */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : filteredBooks.length > 0 ? (
          <div style={viewMode === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '20px' } : { display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredBooks.map((book) => (
              <BookCard key={book._id || book.id} book={book} layout={viewMode} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your library is waiting"
            description="Start building your collection by searching OpenLibrary for titles you own, read, or plan to read."
            actionLabel="Find Your First Book"
            onAction={() => setSearchModalOpen(true)}
          />
        )}

      </div>

      <BookSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onBookAdded={handleBookAdded}
      />
    </AppShell>
  );
};
