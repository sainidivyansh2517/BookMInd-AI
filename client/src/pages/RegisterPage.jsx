import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Target, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [readingGoal, setReadingGoal] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, readingGoal);
      addToast('Account created! Welcome to BookMind AI.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Left Brand Panel */}
      <div
        style={{
          flex: 1,
          backgroundColor: 'var(--accent-subtle)',
          padding: '60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--border-color)'
        }}
        className="desktop-auth-panel"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            B
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            BookMind<span style={{ color: 'var(--accent-primary)' }}>AI</span>
          </span>
        </div>

        <div style={{ maxWidth: '440px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Build your personal digital library today.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Track books, capture notes, and let AI reveal deeper connections in your accumulated knowledge.
          </p>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          BookMind AI • Private Knowledge System
        </div>
      </div>

      {/* Right Form Panel */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: 'auto',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px'
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Create your account
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Start building your private reading workspace in minutes.
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Full Name"
            placeholder="Divyansh Saini"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="reader@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Annual Reading Goal (Books per year)"
            type="number"
            icon={Target}
            value={readingGoal}
            onChange={(e) => setReadingGoal(e.target.value)}
            min={1}
            max={500}
          />

          <Button type="submit" size="lg" isLoading={loading} icon={ArrowRight} style={{ marginTop: '6px' }}>
            Create Account
          </Button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Log In
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-auth-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
