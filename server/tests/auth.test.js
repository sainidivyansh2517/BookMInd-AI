const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('./setup');

describe('Authentication and User Profile Management', () => {
  const uniqueId = Date.now();
  const testUser = {
    name: 'Ada Lovelace',
    email: `Ada.${uniqueId}@Example.COM`, // Test case-insensitivity
    password: 'securePassword123!',
    readingGoal: 30
  };

  it('POST /api/auth/register should fail when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplete@example.com' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /name/i);
  });

  it('POST /api/auth/register should fail on invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: 'not-an-email', password: 'password123' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /valid email/i);
  });

  it('POST /api/auth/register should fail on password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: 'valid@example.com', password: '123' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /at least 6 characters/i);
  });

  it('POST /api/auth/register should successfully create user and return token without password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.name, 'Ada Lovelace');
    assert.equal(res.body.user.email, testUser.email.toLowerCase().trim());
    assert.equal(res.body.user.readingGoal, 30);
    assert.equal(res.body.user.passwordHash, undefined);
  });

  it('POST /api/auth/register should reject duplicate registration with same email (case-insensitive)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Ada',
        email: testUser.email.toLowerCase(),
        password: 'password123'
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /already exists/i);
  });

  it('POST /api/auth/login should authenticate user with normalized email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: `ada.${uniqueId}@example.com`, // all lowercase
        password: testUser.password
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.name, 'Ada Lovelace');
    assert.equal(res.body.user.passwordHash, undefined);
  });

  it('POST /api/auth/login should fail on incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongPassword!'
      });

    assert.equal(res.status, 401);
    assert.match(res.body.message, /invalid email or password/i);
  });

  it('GET /api/auth/me should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('GET /api/auth/me should return authenticated user profile with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'Ada Lovelace');
    assert.equal(res.body.user.email, testUser.email.toLowerCase().trim());
    assert.equal(res.body.user.passwordHash, undefined);
  });

  it('PUT /api/auth/profile should update readingGoal and prevent mass assignment of passwordHash', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = loginRes.body.token;

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Ada King Lovelace',
        readingGoal: 45,
        passwordHash: 'injected_hash',
        email: 'hacked@example.com'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'Ada King Lovelace');
    assert.equal(res.body.user.readingGoal, 45);
    // Email and password must remain untouched
    assert.equal(res.body.user.email, testUser.email.toLowerCase().trim());
    assert.equal(res.body.user.passwordHash, undefined);
  });

  it('PUT /api/auth/profile should reject invalid readingGoal bounds', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = loginRes.body.token;

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ readingGoal: -5 });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /reading goal/i);
  });
});
