import Database from 'better-sqlite3';
import type { EnrichedPet, SessionStatus } from '@pawpal/shared';

export interface SessionRow {
  id: string;
  created_at: number;
  updated_at: number;
  expires_at: number;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  answers_json: string | null;
  favorites_json: string;
}

export interface SearchResultRow {
  session_id: string;
  fetched_at: number;
  results_json: string;
  raw_count: number;
}

export class DbError extends Error {
  constructor(
    public code: 'DB_WRITE_FAILED' | 'DB_READ_FAILED' | 'DB_UNAVAILABLE',
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = 'DbError';
  }
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class DbClient {
  constructor(private db: Database.Database) {}

  createSession(id: string, zipCode?: string): void {
    const now = Date.now();
    try {
      this.db
        .prepare(
          `INSERT INTO sessions (id, created_at, updated_at, expires_at, zip_code, status)
           VALUES (?, ?, ?, ?, ?, 'questionnaire')`,
        )
        .run(id, now, now, now + SESSION_TTL_MS, zipCode ?? null);
    } catch (err) {
      throw this.wrapWriteError(err);
    }
  }

  getSession(id: string): SessionRow | null {
    try {
      const row = this.db
        .prepare('SELECT * FROM sessions WHERE id = ?')
        .get(id) as SessionRow | undefined;
      return row ?? null;
    } catch (err) {
      throw this.wrapReadError(err);
    }
  }

  updateSessionStatus(id: string, status: SessionStatus): void {
    try {
      this.db
        .prepare('UPDATE sessions SET status = ?, updated_at = ? WHERE id = ?')
        .run(status, Date.now(), id);
    } catch (err) {
      throw this.wrapWriteError(err);
    }
  }

  saveAnswers(id: string, answers: Record<string, unknown>): void {
    try {
      this.db
        .prepare('UPDATE sessions SET answers_json = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(answers), Date.now(), id);
    } catch (err) {
      throw this.wrapWriteError(err);
    }
  }

  saveCoordinates(id: string, latitude: number, longitude: number): void {
    try {
      this.db
        .prepare('UPDATE sessions SET latitude = ?, longitude = ?, updated_at = ? WHERE id = ?')
        .run(latitude, longitude, Date.now(), id);
    } catch (err) {
      throw this.wrapWriteError(err);
    }
  }

  saveFavorites(id: string, favorites: string[]): void {
    try {
      this.db
        .prepare('UPDATE sessions SET favorites_json = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(favorites), Date.now(), id);
    } catch (err) {
      throw this.wrapWriteError(err);
    }
  }

  saveResults(sessionId: string, results: EnrichedPet[]): void {
    const json = JSON.stringify(results);
    try {
      this.db
        .prepare(
          `INSERT OR REPLACE INTO search_results (session_id, fetched_at, results_json, raw_count)
           VALUES (?, ?, ?, ?)`,
        )
        .run(sessionId, Date.now(), json, results.length);
    } catch (err) {
      throw this.wrapWriteError(err);
    }
  }

  getResults(sessionId: string): EnrichedPet[] | null {
    try {
      const row = this.db
        .prepare('SELECT results_json FROM search_results WHERE session_id = ?')
        .get(sessionId) as { results_json: string } | undefined;

      if (!row) return null;

      try {
        return JSON.parse(row.results_json) as EnrichedPet[];
      } catch {
        throw new DbError('DB_READ_FAILED', 'Failed to read results', 'Corrupted JSON in results_json');
      }
    } catch (err) {
      if (err instanceof DbError) throw err;
      throw this.wrapReadError(err);
    }
  }

  cleanupExpired(): number {
    try {
      const result = this.db
        .prepare('DELETE FROM sessions WHERE expires_at < ?')
        .run(Date.now());
      return result.changes;
    } catch (err) {
      throw this.wrapWriteError(err);
    }
  }

  private wrapWriteError(err: unknown): DbError {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('SQLITE_BUSY')) {
      return new DbError('DB_UNAVAILABLE', 'Database is busy', msg);
    }
    return new DbError('DB_WRITE_FAILED', 'Failed to write to database', msg);
  }

  private wrapReadError(err: unknown): DbError {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('SQLITE_BUSY')) {
      return new DbError('DB_UNAVAILABLE', 'Database is busy', msg);
    }
    return new DbError('DB_READ_FAILED', 'Failed to read from database', msg);
  }
}
