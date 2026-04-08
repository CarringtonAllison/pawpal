import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import Database from 'better-sqlite3';
import { DbClient } from '../../db/client.js';
import { runMigrations } from '../../db/migrations.js';
import { runPipeline } from '../../agents/orchestrator.js';
import type { SSEEvent } from '@pawpal/shared';

const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/locations/address*';
const RESCUE_GROUPS_URL = 'https://api.rescuegroups.org/v5/public/animals/search/available';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function mockAllApis() {
  server.use(
    http.get(CENSUS_URL, () =>
      HttpResponse.json({
        result: {
          addressMatches: [{
            coordinates: { x: -73.99, y: 40.74 },
            addressComponents: { city: 'New York', state: 'NY' },
          }],
        },
      }),
    ),
    http.post(RESCUE_GROUPS_URL, () =>
      HttpResponse.json({
        data: [{
          id: '123',
          attributes: {
            name: 'Buddy',
            species: 'Dog',
            breedPrimary: 'Golden Retriever',
            ageGroup: 'Young',
            sex: 'Male',
            sizeGroup: 'Large',
            descriptionText: 'A friendly dog',
            pictureThumbnailUrl: 'https://example.com/photo.jpg',
            url: 'https://rescuegroups.org/123',
            distance: 3.5,
            orgName: 'Happy Tails Rescue',
            orgCity: 'New York',
            orgState: 'NY',
            orgPostalcode: '10001',
          },
        }],
      }),
    ),
  );
}

const validAnswers = {
  zipCode: '10001',
  petType: 'dog',
  livingSpace: 'apartment',
  activityLevel: 'moderate',
  experience: 'some',
  allergies: 'none',
  agePreference: 'young',
  sizePreference: 'large',
  household: ['adults_only'],
  temperamentStyle: 'cuddly_affectionate',
  noiseTolerance: 'fine_with_noise',
  breedNotes: null,
};

function makeDbAndSession(): { db: DbClient; sessionId: string } {
  const sqlite = new Database(':memory:');
  runMigrations(sqlite);
  const db = new DbClient(sqlite);
  const sessionId = 'test-session-1';
  db.createSession(sessionId, '10001');
  return { db, sessionId };
}

const mockLog = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  child: vi.fn().mockReturnThis(),
  silent: vi.fn(),
  level: 'info',
} as unknown as import('fastify').FastifyBaseLogger;

const searchConfig = {
  rescueGroupsApiKey: undefined,
};

describe('orchestrator runPipeline', () => {
  it('runs full pipeline and saves results on success', async () => {
    mockAllApis();
    const { db, sessionId } = makeDbAndSession();
    const events: SSEEvent[] = [];

    await runPipeline(sessionId, validAnswers, 25, db, (e) => events.push(e), mockLog, searchConfig);

    const session = db.getSession(sessionId);
    expect(session!.status).toBe('complete');

    const results = db.getResults(sessionId);
    expect(results).not.toBeNull();
    expect(results!.length).toBeGreaterThan(0);

    expect(events.some((e) => e.type === 'progress' && e.stage === 'intake')).toBe(true);
    expect(events.some((e) => e.stage === 'search')).toBe(true);
    expect(events.some((e) => e.type === 'progress' && e.stage === 'matching')).toBe(true);
    expect(events.some((e) => e.type === 'results_ready')).toBe(true);
  });

  it('emits pipeline_error on invalid preferences', async () => {
    const { db, sessionId } = makeDbAndSession();
    const events: SSEEvent[] = [];

    await runPipeline(sessionId, { zipCode: 'bad' }, 25, db, (e) => events.push(e), mockLog, searchConfig);

    expect(events.some((e) => e.type === 'pipeline_error' && e.code === 'INVALID_PREFERENCES')).toBe(true);
    expect(db.getSession(sessionId)!.status).toBe('error');
  });

  it('emits pipeline_error when RescueGroups fails', async () => {
    server.use(
      http.get(CENSUS_URL, () =>
        HttpResponse.json({
          result: {
            addressMatches: [{
              coordinates: { x: -73.99, y: 40.74 },
              addressComponents: { city: 'New York', state: 'NY' },
            }],
          },
        }),
      ),
      http.post(RESCUE_GROUPS_URL, () => new HttpResponse(null, { status: 500 })),
    );

    const { db, sessionId } = makeDbAndSession();
    const events: SSEEvent[] = [];

    await runPipeline(sessionId, validAnswers, 25, db, (e) => events.push(e), mockLog, searchConfig);

    expect(events.some((e) => e.type === 'pipeline_error' && e.stage === 'search')).toBe(true);
    expect(db.getSession(sessionId)!.status).toBe('error');
  });

  it('never throws — catches unexpected errors', async () => {
    const { db, sessionId } = makeDbAndSession();
    const events: SSEEvent[] = [];

    await runPipeline(sessionId, null as unknown as Record<string, unknown>, 25, db, (e) => events.push(e), mockLog, searchConfig);

    expect(events.some((e) => e.type === 'pipeline_error')).toBe(true);
  });
});
