import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../index.js';
import type { FastifyInstance } from 'fastify';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

let app: FastifyInstance;

beforeAll(async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'pawpal-test-'));
  const result = await buildApp({ dbPath: join(tmpDir, 'test.db') });
  app = result.app;
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});
