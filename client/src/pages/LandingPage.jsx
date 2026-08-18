import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Sparkles, Compass, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 48px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
            B
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            BookMind<span style={{ color: 'var(--accent-primary)' }}>AI</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <Button onClick={() => navigate('/dashboard')} icon={ArrowRight}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log In
              </Button>
              <Button onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '80px 24px 60px 24px',
          textAlign: 'center',
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            backgroundColor: 'var(--accent-subtle)',
            color: 'var(--accent-primary)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginBottom: '24px'
          }}
        >
          <Sparkles size={15} />
          <span>Intelligent Knowledge-Management Platform</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            color: 'var(--text-primary)'
          }}
        >
          Your books. Your thoughts.<br />
          <span style={{ color: 'var(--accent-primary)' }}>One intelligent reading space.</span>
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            lineHeight: 1.6,
            marginBottom: '36px'
          }}
        >
          Track what you read, capture what you learn, and use AI to make more of your accumulated reading knowledge.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button size="lg" onClick={() => navigate(user ? '/dashboard' : '/register')} icon={ArrowRight}>
            Start Building Your Library
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate(user ? '/books' : '/login')}>
            Explore the Product
          </Button>
        </div>

        {/* Product Preview Showcase Mockup */}
        <div
          style={{
            marginTop: '60px',
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            padding: '24px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Currently Reading</div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 600 }}>Atomic Habits</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>James Clear • 62% complete</p>
              <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ width: '62%', height: '100%', backgroundColor: 'var(--accent-primary)' }} />
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Latest Note</div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 600 }}>Identity-Based Habits</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>"Your identity influences the habits you build..."</p>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>#habits #identity</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(79,70,229,0.2)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '4px' }}>✦ BookMind AI Answer</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-text)', lineHeight: 1.4 }}>
                "Based on your notes across 4 books, your main focus is on reducing distraction and building friction-free daily routines."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '80px' }}>
          
          {/* Section 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '12px' }}><BookOpen size={28} /></div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>
                Your Digital Bookshelf
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Keep every book you're reading, finished, or planning to read in one organized private place with OpenLibrary integration.
              </p>
            </div>
            <div style={{ padding: '24px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>OpenLibrary Instant Metadata Search</div>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Search "Deep Work", "Essentialism", "Dune"...
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <div style={{ order: 2 }}>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '12px' }}><FileText size={28} /></div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>
                Capture What You Learn
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Never forget key insights. Transform reading into a personal knowledge workspace with book-linked notes, tags, and reflection prompts.
              </p>
            </div>
            <div style={{ order: 1, padding: '24px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '6px' }}>Book → Notes → Knowledge</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tag ideas, synthesize concepts, and build a lasting personal second brain.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--accent-primary)', marginBottom: '12px' }}><Sparkles size={28} /></div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>
                AI Reading Companion
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Query your notes, generate book summaries, and receive tailored recommendations backed by explicit reasoning.
              </p>
            </div>
            <div style={{ padding: '24px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '6px' }}>✦ You asked:</div>
              <p style={{ fontSize: '0.875rem', fontStyle: 'italic', marginBottom: '12px' }}>"What are the main principles I noted from Atomic Habits?"</p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                BookMind: "Based on your saved notes: 1. Focus on identity alignment. 2. Reduce friction for good habits..."
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Final CTA Footer Section */}
      <footer
        style={{
          marginTop: 'auto',
          backgroundColor: 'var(--bg-main)',
          borderTop: '1px solid var(--border-color)',
          padding: '60px 24px',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>
            Build a reading system that remembers.
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Join readers, researchers, and self-learners using BookMind AI.
          </p>
          <Button size="lg" onClick={() => navigate(user ? '/dashboard' : '/register')}>
            Create Your Library
          </Button>
          <div style={{ marginTop: '40px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © 2026 BookMind AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
