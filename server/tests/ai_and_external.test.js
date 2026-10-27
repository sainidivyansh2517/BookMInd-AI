const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('./setup');
const GeminiService = require('../src/services/geminiService');
const OpenLibraryService = require('../src/services/openLibraryService');

describe('AI Assistant & External Services Integration', () => {
  let userToken = '';

  before(async () => {
    const timestamp = Date.now();
    const res = await request(app).post('/api/auth/register').send({
      name: 'AI Test User',
      email: `aitest.${timestamp}@example.com`,
      password: 'password123'
    });
    userToken = res.body.token;
  });

  it('POST /api/ai/chat should require authentication', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ prompt: 'Hello BookMind' });
    assert.equal(res.status, 401);
  });

  it('POST /api/ai/chat should reject missing or empty prompt', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: '   ' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /prompt.*required/i);
  });

  it('POST /api/ai/chat should reject prompts exceeding 4000 characters', async () => {
    const hugePrompt = 'A'.repeat(4001);
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: hugePrompt });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /exceeds maximum allowed length/i);
  });

  it('POST /api/ai/chat (non-streaming) should generate valid response with fallback indicator if offline', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: 'Summarize my reading takeaways', stream: false });

    assert.equal(res.status, 200);
    assert.ok(res.body.response);
    assert.ok(typeof res.body.response === 'string');
    assert.ok(res.body.chatId);
    assert.equal(typeof res.body.isFallback, 'boolean');
  });

  it('GET /api/ai/recommendations should return 4 structured recommendations', async () => {
    const res = await request(app)
      .get('/api/ai/recommendations')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.recommendations));
    assert.ok(res.body.recommendations.length >= 4);

    const first = res.body.recommendations[0];
    assert.ok(first.title);
    assert.ok(first.author);
    assert.ok(first.reason);
  });

  it('GeminiService deterministic fallback generator should synthesize structured markdown with notice', () => {
    const fallbackText = GeminiService.generateSmartFallbackResponse(
      'give me a summary of habits',
      { title: 'Atomic Habits', authors: ['James Clear'], progressPages: 100, totalPages: 250 },
      [{ title: 'Cue & Routine', content: 'Habits form via loops' }],
      [{ title: 'Atomic Habits', authors: ['James Clear'], status: 'currently_reading' }]
    );

    assert.ok(fallbackText.includes('Atomic Habits'));
    assert.ok(fallbackText.includes('Offline Synthesis Engine'));
    assert.ok(fallbackText.includes('James Clear'));
  });

  it('OpenLibraryService should handle empty queries and gracefully return empty array', async () => {
    const emptyResults = await OpenLibraryService.searchBooks('');
    assert.deepEqual(emptyResults, []);

    const whitespaceResults = await OpenLibraryService.searchBooks('   ');
    assert.deepEqual(whitespaceResults, []);
  });
});
