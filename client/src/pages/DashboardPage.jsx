import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, BookMarked, Target, Plus, Sparkles, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { BookCover } from '../components/books/BookCover';
import { ProgressBar } from '../components/ui/ProgressBar';
import { NoteCard } from '../components/notes/NoteCard';
import { SkeletonCard, SkeletonRow } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

// === API fetch helpers ===
const fetchBooks = async () => {
  const res = await axios.get('/api/books');
  return res.data.books || [];
};

const fetchNotes = async () => {
  const res = await axios.get('/api/notes');
  return res.data.notes || [];
};

const fetchRecommendations = async () => {
  const res = await axios.get('/api/ai/recommendations');
  return res.data.recommendations || [];
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Independent query per section — none blocks the others
  const {
    data: books = [],
    isLoading: isBooksLoading,
  } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: notes = [],
    isLoading: isNotesLoading,
  } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
    staleTime: 2 * 60 * 1000,
  });

  // AI recs are FULLY independent — no blocking
  const {
    data: recommendations = [],
    isLoading: isRecsLoading,
    isError: isRecsError,
    refetch: refetchRecs,
  } = useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
    staleTime: 10 * 60 * 1000, // 10 min — they're server-cached for 12h
    retry: 1,
  });

  // Invalidate books + notes when a book is added via AppShell
  const handleBookAdded = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  }, [queryClient]);

  // Dynamic Greeting based on hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate Metrics from books (shows immediately after books load)
  const completedBooks = books.filter((b) => b.status === 'completed');
  const currentlyReading = books.filter((b) => b.status === 'currently_reading');
  const wantToRead = books.filter((b) => b.status === 'want_to_read');
  const readingGoal = user?.readingGoal || 24;
  const activeBook = currentlyReading[0] || books[0];

  return (
    <AppShell onBookAdded={handleBookAdded}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Dynamic Header — renders immediately */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {getGreeting()}, {user?.name || 'Reader'}.
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Keep building your reading habit and capturing ideas worth remembering.
            </p>
          </div>
          <Button icon={Plus} onClick={() => navigate('/books')}>
            Explore Library
          </Button>
        </div>

        {/* 4 KPI Cards — render once books load, skeletons until then */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {isBooksLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div className="skeleton-pulse" style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton-pulse" style={{ height: '12px', width: '60%' }} />
                    <div className="skeleton-pulse" style={{ height: '26px', width: '40%' }} />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard icon={BookCheckIcon} label="Books Read" value={completedBooks.length} subtext="Finished title(s)" color="var(--status-success)" />
              <StatCard icon={BookOpen} label="Currently Reading" value={currentlyReading.length} subtext="In active progress" color="var(--accent-primary)" />
              <StatCard icon={BookMarked} label="Want to Read" value={wantToRead.length} subtext="Saved to wishlist" color="var(--status-warning)" />
              <StatCard icon={Target} label="Reading Goal" value={`${completedBooks.length} / ${readingGoal}`} subtext={`${Math.min(100, Math.round((completedBooks.length / readingGoal) * 100))}% achieved`} color="var(--accent-text)" />
            </>
          )}
        </div>

        {/* Main 2-Column Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Left: Continue Reading */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Continue Reading
              </h2>
              {currentlyReading.length > 1 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  +{currentlyReading.length - 1} more in progress
                </span>
              )}
            </div>

            {isBooksLoading ? (
              <SkeletonCard />
            ) : activeBook ? (
              <div style={{ display: 'flex', gap: '20px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '110px', flexShrink: 0 }}>
                  <BookCover coverUrl={activeBook.coverUrl} title={activeBook.title} authors={activeBook.authors} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {activeBook.status === 'currently_reading' ? 'Active Book' : 'Featured in Library'}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '4px' }}>
                      {activeBook.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {Array.isArray(activeBook.authors) ? activeBook.authors.join(', ') : activeBook.authors}
                    </p>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <span>Reading Progress</span>
                      <span style={{ fontWeight: 600 }}>
                        {Math.round(((activeBook.progressPages || 0) / (activeBook.totalPages || 250)) * 100)}%
                      </span>
                    </div>
                    <ProgressBar value={activeBook.progressPages || 0} max={activeBook.totalPages || 250} />
                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <Button size="sm" onClick={() => navigate(`/books/${activeBook._id || activeBook.id}`)}>
                        Continue Reading
                      </Button>
                      <Button size="sm" variant="outline" icon={Sparkles} onClick={() => navigate('/ai')}>
                        Ask AI
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '32px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  You don't have any books marked as "Currently Reading" right now.
                </p>
                <Button size="sm" onClick={() => navigate('/books')}>Find a Book</Button>
              </div>
            )}
          </div>

          {/* Right: Recent Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Recent Notes
              </h2>
              <button onClick={() => navigate('/notes')} style={{ fontSize: '0.8125rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                View all
              </button>
            </div>

            {isNotesLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : notes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notes.slice(0, 3).map((note) => (
                  <NoteCard key={note._id || note.id} note={note} />
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  No personal notes saved yet. Capture your first idea from what you're reading.
                </p>
                <Button size="sm" variant="outline" icon={FileText} onClick={() => navigate('/notes')}>
                  Create Note
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations — FULLY INDEPENDENT section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" />
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Recommended for You
              </h2>
              {isRecsLoading && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Personalizing...
                </span>
              )}
            </div>
            <button onClick={() => navigate('/recommendations')} style={{ fontSize: '0.8125rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              See all picks
            </button>
          </div>

          {isRecsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="skeleton-pulse" style={{ height: '14px', width: '40%', borderRadius: 'var(--radius-sm)' }} />
                  <div className="skeleton-pulse" style={{ height: '20px', width: '80%', borderRadius: 'var(--radius-sm)' }} />
                  <div className="skeleton-pulse" style={{ height: '12px', width: '55%', borderRadius: 'var(--radius-sm)' }} />
                  <div className="skeleton-pulse" style={{ height: '60px', width: '100%', borderRadius: 'var(--radius-sm)' }} />
                </div>
              ))}
            </div>
          ) : isRecsError ? (
            // AI failure never breaks the dashboard
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              <AlertCircle size={18} color="var(--text-muted)" />
              <span style={{ flex: 1, fontSize: '0.9rem' }}>Recommendations are temporarily unavailable.</span>
              <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => refetchRecs()}>
                Try Again
              </Button>
            </div>
          ) : recommendations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      {rec.genre || 'Recommended'}
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {rec.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rec.author}</p>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-surface-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                    "{rec.reason}"
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

      </div>
    </AppShell>
  );
};

const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
  <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', color: color || 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={22} />
    </div>
    <div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{subtext}</div>
    </div>
  </div>
);

const BookCheckIcon = (props) => <BookOpen {...props} />;
