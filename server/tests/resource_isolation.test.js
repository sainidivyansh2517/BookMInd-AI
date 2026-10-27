const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('./setup');

describe('Resource Ownership, Isolation & Data Validation', () => {
  let tokenA = '';
  let tokenB = '';
  let bookIdA = '';
  let noteIdA = '';

  before(async () => {
    const timestamp = Date.now();
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User Alpha',
      email: `alpha.${timestamp}@test.com`,
      password: 'password123'
    });
    tokenA = resA.body.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User Beta',
      email: `beta.${timestamp}@test.com`,
      password: 'password123'
    });
    tokenB = resB.body.token;
  });

  it('User A should successfully add a book to their library', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Designing Data-Intensive Applications',
        authors: ['Martin Kleppmann'],
        totalPages: 550,
        status: 'currently_reading',
        rating: 5
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.book);
    bookIdA = res.body.book._id || res.body.book.id;
    assert.ok(bookIdA);
  });

  it('POST /api/books should reject progressPages exceeding totalPages or negative pages', async () => {
    const res = await request(app)
      .put(`/api/books/${bookIdA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ progressPages: 900 }); // Exceeds totalPages 550

    assert.equal(res.status, 400);
    assert.match(res.body.message, /cannot exceed/i);

    const resNegative = await request(app)
      .put(`/api/books/${bookIdA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ progressPages: -10 });

    assert.equal(resNegative.status, 400);
    assert.match(resNegative.body.message, /negative/i);
  });

  it('PUT /api/books should reject invalid reading status enum', async () => {
    const res = await request(app)
      .put(`/api/books/${bookIdA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'invalid_status_value' });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /invalid reading status/i);
  });

  it('SECURITY: User B MUST NOT be able to view User A\'s book details (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/books/${bookIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(res.status, 403);
    assert.match(res.body.message, /access denied|do not own/i);
  });

  it('SECURITY: User B MUST NOT be able to update User A\'s book', async () => {
    const res = await request(app)
      .put(`/api/books/${bookIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Compromised Book Title' });

    assert.equal(res.status, 404);
  });

  it('SECURITY: User B MUST NOT be able to delete User A\'s book', async () => {
    const res = await request(app)
      .delete(`/api/books/${bookIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(res.status, 404);
  });

  it('User A should create a note attached to their book', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Replication Strategies',
        content: 'Leader-based replication ensures single leader writes while read replicas scale reads.',
        bookId: bookIdA,
        tags: ['architecture', 'replication']
      });

    assert.equal(res.status, 201);
    noteIdA = res.body.note._id || res.body.note.id;
    assert.ok(noteIdA);
  });

  it('SECURITY: User B MUST NOT be able to attach a note to User A\'s book (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'Illicit Note',
        content: 'Trying to attach to a book I do not own.',
        bookId: bookIdA
      });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /cannot attach note to a book you do not own/i);
  });

  it('SECURITY: User B MUST NOT be able to read User A\'s note', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(res.status, 404);
  });

  it('SECURITY: User B MUST NOT be able to edit User A\'s note', async () => {
    const res = await request(app)
      .put(`/api/notes/${noteIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Tampered note content' });

    assert.equal(res.status, 404);
  });

  it('SECURITY: User B MUST NOT be able to delete User A\'s note', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(res.status, 404);
  });

  it('User B\'s personal library and notes must remain completely isolated', async () => {
    const libraryRes = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(libraryRes.status, 200);
    assert.equal(libraryRes.body.books.length, 0);

    const notesRes = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(notesRes.status, 200);
    assert.equal(notesRes.body.notes.length, 0);
  });
});
