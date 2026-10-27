const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('./setup');

describe('Health and System Status Endpoints', () => {
  it('GET /api/health should return 200 with service information and storage status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'BookMind AI Backend');
    assert.ok(res.body.storage);
    assert.equal(typeof res.body.uptimeSeconds, 'number');
  });

  it('GET /api/ready should report readiness in test mode', async () => {
    const res = await request(app).get('/api/ready');
    assert.equal(res.status, 200);
    assert.equal(res.body.ready, true);
    assert.ok(res.body.storage);
  });

  it('GET /api/nonexistent-endpoint should return 404 with structured JSON message', async () => {
    const res = await request(app).get('/api/nonexistent-endpoint');
    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Requested API endpoint not found.');
  });
});
