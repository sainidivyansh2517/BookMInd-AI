import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Sparkles, Trash2, RefreshCw, User, Bot, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

export const AIChat = ({ bookId = null, initialMessages = [], suggestedPrompts = [] }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (userPrompt) => {
    const textToSend = userPrompt || prompt;
    if (!textToSend || !textToSend.trim() || loading) return;

    setError(null);
    const userMsg = { role: 'user', content: textToSend.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', {
        prompt: textToSend.trim(),
        bookId,
        chatId
      });

      const { response: aiText, chatId: returnedChatId } = res.data;
      if (returnedChatId) setChatId(returnedChatId);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiText, timestamp: new Date().toISOString() }
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'BookMind AI could not complete that request right now.');
      addToast('AI Assistant request failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (chatId) {
      try {
        await axios.delete(`/api/ai/chat/${chatId}`);
      } catch (e) {
        // ignore
      }
    }
    setMessages([]);
    setChatId(null);
    setError(null);
    addToast('Chat conversation cleared.', 'info');
  };

  const defaultPrompts = suggestedPrompts.length > 0 ? suggestedPrompts : [
    'What are the most important ideas I noted?',
    'Summarize my recent reading progress',
    'What major themes connect my saved books?',
    'Give me 3 practical habit principles from my library'
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              BookMind AI Companion
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {bookId ? 'Context-aware for this book' : 'Connected to your entire reading library'}
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <Button variant="ghost" size="sm" icon={Trash2} onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {/* Message Area */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} />
            </div>
            <div style={{ maxWidth: '420px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                How can BookMind assist your reading today?
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Ask questions about your saved books, synthesize notes, explore theme connections, or request personalized reading takeaways.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '540px', marginTop: '12px' }}>
              {defaultPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8125rem',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  ✦ {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={18} />
                </div>
              )}

              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                  color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }}
              >
                {msg.role === 'user' ? (
                  <div>{msg.content}</div>
                ) : (
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{
                      __html: formatSimpleMarkdown(msg.content)
                    }}
                  />
                )}
              </div>

              {msg.role === 'user' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={16} />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)', fontSize: '0.875rem', padding: '8px 0' }}>
            <Sparkles size={18} className="animate-spin" />
            <span style={{ fontWeight: 500 }}>✦ BookMind is thinking...</span>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
            <AlertCircle size={18} />
            <div style={{ flex: 1 }}>{error}</div>
            <Button size="sm" variant="danger" icon={RefreshCw} onClick={() => handleSend(messages[messages.length - 1]?.content)}>
              Try Again
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          gap: '10px',
          padding: '14px 18px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <input
          type="text"
          placeholder={bookId ? 'Ask anything about this book or your notes...' : 'Ask BookMind about your reading, notes, or books...'}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            height: '42px',
            padding: '0 16px',
            backgroundColor: 'var(--bg-surface-subtle)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            outline: 'none',
            fontSize: '0.875rem'
          }}
        />
        <Button type="submit" isLoading={loading} disabled={!prompt.trim()} icon={Send} style={{ borderRadius: 'var(--radius-full)' }}>
          Send
        </Button>
      </form>
    </div>
  );
};

// Lightweight markdown renderer helper
function formatSimpleMarkdown(text = '') {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n\n/g, '<br/><br/>');
}
