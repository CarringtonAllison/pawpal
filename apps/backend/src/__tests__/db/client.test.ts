import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { DbClient } from '../../db/client.js';
import { runMigrations } from '../../db/migrations.js';
import type { EnrichedPet } from '@pawpal/shared';

let db: DbClient;
let sqlite: Database.Database;

beforeEach(() => {
  sqlite = new Database(':memory:');
  runMigrations(sqlite);
  db = new DbClient(sqlite);
});

describe('DbClient', () => {
  it('createSession inserts a row and can be retrieved by getSession', () => {
    const id = 'test-session-001';
    db.createSession(id, '10001');

    const session = db.getSession(id);
    expect(session).not.toBeNull();
    expect(session!.id).toBe(id);
    expect(session!.zip_code).toBe('10001');
    expect(session!.status).toBe('questionnaire');
  });

  it('getSession returns null when sessionId does not exist', () => {
    const session = db.getSession('nonexistent');
    expect(session).toBeNull();
  });

  it('updateSessionStatus changes the status', () => {
    db.createSession('s1');
    db.updateSessionStatus('s1', 'searching');
    expect(db.getSession('s1')!.status).toBe('searching');
  });

  it('saveAnswers stores JSON that can be retrieved', () => {
    db.createSession('s1');
    db.saveAnswers('s1', { petType: 'dog', livingSpace: 'apartment' });

    const session = db.getSession('s1');
    const answers = JSON.parse(session!.answers_json!);
    expect(answers.petType).toBe('dog');
    expect(answers.livingSpace).toBe('apartment');
  });

  it('saveFavorites stores and retrieves pet IDs', () => {
    db.createSession('s1');
    db.saveFavorites('s1', ['pf-123', 'rg-456']);

    const session = db.getSession('s1');
    const favorites = JSON.parse(session!.favorites_json);
    expect(favorites).toEqual(['pf-123', 'rg-456']);
  });

  it('saveResults stores JSON that round-trips correctly through getResults', () => {
    db.createSession('s1');
    const mockResults: EnrichedPet[] = [
      {
        id: 'pf-1',
        source: 'rescuegroups',
        sourceUrl: 'https://rescuegroups.org/1',
        listingType: 'rescue',
        name: 'Buddy',
        species: 'dog',
        breedPrimary: 'Golden Retriever',
        breedMixed: false,
        age: 'young',
        gender: 'male',
        size: 'large',
        description: 'Good dog',
        photos: [],
        breedPhotos: [],
        shelterTraits: {
          environment: { children: true, dogs: true, cats: null },
          attributes: { spayed_neutered: true, house_trained: true, special_needs: false, shots_current: true },
          tags: ['friendly'],
        },
        breedTraits: null,
        shelter: { name: 'Test Shelter', address: '123 Main', city: 'NY', state: 'NY', zip: '10001', phone: null, website: null, distanceMiles: 2.5 },
        listedAt: null,
        matchScore: 92,
        dimensionScores: { activity: 85 },
        matchExplanation: 'Great match',
        strengthLabels: ['Active lifestyle'],
      },
    ];

    db.saveResults('s1', mockResults);
    const results = db.getResults('s1');
    expect(results).toHaveLength(1);
    expect(results![0].name).toBe('Buddy');
    expect(results![0].matchScore).toBe(92);
  });

  it('getResults returns null when no results exist', () => {
    db.createSession('s1');
    expect(db.getResults('s1')).toBeNull();
  });

  it('cleanupExpired deletes expired sessions', () => {
    // Create a session that expired 1 second ago
    const now = Date.now();
    sqlite.prepare(
      `INSERT INTO sessions (id, created_at, updated_at, expires_at, status, favorites_json)
       VALUES (?, ?, ?, ?, 'questionnaire', '[]')`,
    ).run('expired-1', now - 100000, now - 100000, now - 1000);

    // Create a valid session
    db.createSession('valid-1');

    const deleted = db.cleanupExpired();
    expect(deleted).toBe(1);
    expect(db.getSession('expired-1')).toBeNull();
    expect(db.getSession('valid-1')).not.toBeNull();
  });

  it('cascade deletes search_results when session is cleaned up', () => {
    const now = Date.now();
    sqlite.prepare(
      `INSERT INTO sessions (id, created_at, updated_at, expires_at, status, favorites_json)
       VALUES (?, ?, ?, ?, 'complete', '[]')`,
    ).run('expired-2', now - 100000, now - 100000, now - 1000);

    sqlite.prepare(
      `INSERT INTO search_results (session_id, fetched_at, results_json, raw_count)
       VALUES (?, ?, '[]', 0)`,
    ).run('expired-2', now);

    db.cleanupExpired();

    const row = sqlite.prepare('SELECT * FROM search_results WHERE session_id = ?').get('expired-2');
    expect(row).toBeUndefined();
  });
});

describe('migrations', () => {
  it('are idempotent (running twice does not error)', () => {
    const freshDb = new Database(':memory:');
    runMigrations(freshDb);
    runMigrations(freshDb); // should not throw
    freshDb.close();
  });
});
