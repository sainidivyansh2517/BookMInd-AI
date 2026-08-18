import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, BookOpen, FileText, Award, Edit2, Check, User } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Form State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal || 24);
  const [genresInput, setGenresInput] = useState((user?.favoriteGenres || []).join(', '));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [booksRes, notesRes] = await Promise.all([
        axios.get('/api/books'),
        axios.get('/api/notes')
      ]);
      setBooks(booksRes.data.books || []);
      setNotes(notesRes.data.notes || []);
    } catch (err) {
      addToast('Failed to load profile activity.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const genresArray = genresInput.split(',').map((g) => g.trim()).filter(Boolean);
      await updateProfile({
        name,
        readingGoal: Number(readingGoal),
        favoriteGenres: genresArray
      });
      addToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (err) {
      addToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const completedCount = books.filter((b) => b.status === 'completed').length;
  const inProgressCount = books.filter((b) => b.status === 'currently_reading').length;
  const goalTarget = user?.readingGoal || 24;
  const percentGoal = Math.min(100, Math.round((completedCount / goalTarget) * 100));

  // Activity Chart Data (Monthly reading completion)
  const activityData = [
    { month: 'Jan', books: 2 },
    { month: 'Feb', books: 3 },
    { month: 'Mar', books: 1 },
    { month: 'Apr', books: 4 },
    { month: 'May', books: 2 },
    { month: 'Jun', books: 3 },
    { month: 'Jul', books: completedCount > 5 ? completedCount - 5 : completedCount }
  ];

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header Profile Identity Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 700,
                fontFamily: 'var(--font-serif)'
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {user?.name || 'Reader'}
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user?.email}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {(user?.favoriteGenres || ['Productivity', 'Self-Improvement', 'Philosophy']).map((genre, idx) => (
                  <Badge key={idx} variant="tag">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button variant={isEditing ? 'outline' : 'primary'} icon={isEditing ? Check : Edit2} onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel Edit' : 'Edit Reading Identity'}
          </Button>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600 }}>Update Reading Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Annual Reading Goal (Books)" type="number" value={readingGoal} onChange={(e) => setReadingGoal(e.target.value)} required />
              <Input label="Favorite Genres (comma separated)" value={genresInput} onChange={(e) => setGenresInput(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="submit" isLoading={saving}>Save Changes</Button>
            </div>
          </form>
        )}

        {/* Goal & Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Reading Goal Progress Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} color="var(--accent-primary)" />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600 }}>Annual Reading Goal</h3>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {completedCount} / {goalTarget} books
              </span>
            </div>

            <ProgressBar value={completedCount} max={goalTarget} height="12px" showPercent />

            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              You have completed {completedCount} books toward your target of {goalTarget} books this year ({percentGoal}% completed).
            </p>
          </div>

          {/* Quick Summary Counts */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}
          >
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '4px' }}><BookOpen size={20} /></div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700 }}>{books.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Books in Library</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ color: 'var(--status-success)', marginBottom: '4px' }}><FileText size={20} /></div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700 }}>{notes.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved Personal Notes</div>
            </div>
          </div>

        </div>

        {/* Reading Activity Chart */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Reading Activity
          </h3>

          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="books" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
