import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { AIChat } from '../components/ai/AIChat';

export const AIAssistantPage = () => {
  return (
    <AppShell>
      <div style={{ maxWidth: '1000px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            BookMind AI Assistant
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Ask questions about your reading library, synthesize personal notes, and discover patterns in your knowledge.
          </p>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <AIChat />
        </div>
      </div>
    </AppShell>
  );
};
