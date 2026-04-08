import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../index.js';
import type { FastifyInstance } from 'fastify';
import type { DbClient } from '../../db/client.js';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

let app: FastifyInstance;
let db: DbClient;

beforeAll(async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'pawpal-test-'));
  const result = await buildApp({ dbPath: join(tmpDir, 'test.db') });
  app = result.app;
  db = result.db;
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /api/sessions', () => {
  it('creates a session and returns an id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBe(36); // UUID format
  });

  it('creates a session with optional zipCode', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: { zipCode: '10001' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 422 for invalid zipCode format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: { zipCode: 'abc' },
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('GET /api/sessions/:sessionId', () => {
  let sessionId: string;

  beforeEach(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: { zipCode: '10001' },
    });
    sessionId = res.json().id;
  });

  it('returns session data', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/sessions/${sessionId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(sessionId);
    expect(body.status).toBe('questionnaire');
    expect(body.zipCode).toBe('10001');
  });

  it('returns 404 for unknown session', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/sessions/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('SESSION_NOT_FOUND');
  });

  it('returns 422 for invalid UUID format', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/sessions/not-a-uuid',
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('PATCH /api/sessions/:sessionId/answers', () => {
  let sessionId: string;

  beforeEach(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: {},
    });
    sessionId = res.json().id;
  });

  it('saves partial answers', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/sessions/${sessionId}/answers`,
      payload: { petType: 'dog', livingSpace: 'apartment' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);

    // Verify answers persisted
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/sessions/${sessionId}`,
    });
    const body = getRes.json();
    expect(body.answers.petType).toBe('dog');
    expect(body.answers.livingSpace).toBe('apartment');
  });

  it('merges with existing answers', async () => {
    await app.inject({
      method: 'PATCH',
      url: `/api/sessions/${sessionId}/answers`,
      payload: { petType: 'dog' },
    });

    await app.inject({
      method: 'PATCH',
      url: `/api/sessions/${sessionId}/answers`,
      payload: { livingSpace: 'apartment' },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/sessions/${sessionId}`,
    });
    const body = res.json();
    expect(body.answers.petType).toBe('dog');
    expect(body.answers.livingSpace).toBe('apartment');
  });

  it('returns 404 for unknown session', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/sessions/00000000-0000-0000-0000-000000000000/answers',
      payload: { petType: 'dog' },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /api/sessions/:sessionId/favorites', () => {
  let sessionId: string;

  beforeEach(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: {},
    });
    sessionId = res.json().id;
  });

  it('saves favorites array', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/sessions/${sessionId}/favorites`,
      payload: { favorites: ['pf-123', 'rg-456'] },
    });
    expect(res.statusCode).toBe(200);

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/sessions/${sessionId}`,
    });
    expect(getRes.json().favorites).toEqual(['pf-123', 'rg-456']);
  });

  it('returns 422 when favorites is not an array of strings', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/sessions/${sessionId}/favorites`,
      payload: { favorites: [123, true] },
    });
    expect(res.statusCode).toBe(422);
  });

  it('returns 404 for unknown session', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/sessions/00000000-0000-0000-0000-000000000000/favorites',
      payload: { favorites: [] },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/sessions/:sessionId/search', () => {
  let sessionId: string;

  beforeEach(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: {},
    });
    sessionId = res.json().id;
  });

  it('returns 202 and updates status to searching', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/sessions/${sessionId}/search`,
    });
    expect(res.statusCode).toBe(202);

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/sessions/${sessionId}`,
    });
    expect(getRes.json().status).toBe('searching');
  });

  it('returns 409 when search is already in progress', async () => {
    await app.inject({
      method: 'POST',
      url: `/api/sessions/${sessionId}/search`,
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/sessions/${sessionId}/search`,
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 404 for unknown session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions/00000000-0000-0000-0000-000000000000/search',
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/sessions/:sessionId/results', () => {
  let sessionId: string;

  beforeEach(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: {},
    });
    sessionId = res.json().id;
  });

  it('returns 404 when no results exist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/sessions/${sessionId}/results`,
    });
    expect(res.statusCode).toBe(404);
  });
});
