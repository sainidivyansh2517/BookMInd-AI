import React, { useState } from 'react';
import { Sun, Moon, Monitor, Shield, Lock, User, Target } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal || 24);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, readingGoal: Number(readingGoal) });
      addToast('Settings saved successfully.', 'success');
    } catch (err) {
      addToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
        
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Settings & Preferences
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Manage appearance themes, account details, and privacy configurations.
          </p>
        </div>

        {/* Section 1: Appearance Theme */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={20} color="var(--accent-primary)" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600 }}>Appearance Theme</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { id: 'light', label: 'Light Theme', icon: Sun },
              { id: 'dark', label: 'Dark Theme', icon: Moon },
              { id: 'system', label: 'System Default', icon: Monitor }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  border: theme === t.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  backgroundColor: theme === t.id ? 'var(--accent-subtle)' : 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: theme === t.id ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <t.icon size={18} color={theme === t.id ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Account Details */}
        <form onSubmit={handleSaveSettings} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="var(--accent-primary)" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600 }}>Account & Reading Goal</h3>
          </div>

          <Input label="Full Name" icon={User} value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email Address" icon={Lock} value={user?.email || ''} disabled helperText="Email cannot be changed directly." />
          <Input label="Annual Reading Target (Books)" type="number" icon={Target} value={readingGoal} onChange={(e) => setReadingGoal(e.target.value)} required />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button type="submit" isLoading={saving}>
              Save Preferences
            </Button>
          </div>
        </form>

        {/* Section 3: Privacy UX */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="var(--status-success)" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600 }}>Privacy & Data Isolation</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            BookMind AI enforces strict user-level resource ownership. Your library books, personal notes, and AI conversations are private to your account and never shared publicly.
          </p>
        </div>

      </div>
    </AppShell>
  );
};
