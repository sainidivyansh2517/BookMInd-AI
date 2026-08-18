import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, FileText, Sparkles, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const MobileNav = () => {
  const { theme, setTheme } = useTheme();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Library', path: '/books', icon: BookOpen },
    { label: 'Notes', path: '/notes', icon: FileText },
    { label: 'AI', path: '/ai', icon: Sparkles },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
        className="mobile-only-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
            B
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            BookMind<span style={{ color: 'var(--accent-primary)' }}>AI</span>
          </span>
        </div>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ padding: '6px', color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0',
          zIndex: 9000,
          boxShadow: 'var(--shadow-lg)'
        }}
        className="mobile-only-nav"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.7rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)'
            })}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};
