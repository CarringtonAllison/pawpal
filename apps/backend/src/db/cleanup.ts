import type { DbClient } from './client.js';
import type { FastifyBaseLogger } from 'fastify';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function startCleanupInterval(db: DbClient, log: FastifyBaseLogger): NodeJS.Timeout {
  return setInterval(() => {
    try {
      const count = db.cleanupExpired();
      if (count > 0) {
        log.info({ deletedSessions: count }, 'Session cleanup sweep completed');
      }
    } catch (err) {
      log.error({ err }, 'Session cleanup sweep failed');
    }
  }, CLEANUP_INTERVAL_MS);
}

export function runStartupCleanup(db: DbClient, log: FastifyBaseLogger): void {
  try {
    const count = db.cleanupExpired();
    log.info({ deletedSessions: count }, 'Startup cleanup sweep completed');
  } catch (err) {
    log.error({ err }, 'Startup cleanup sweep failed');
  }
}
