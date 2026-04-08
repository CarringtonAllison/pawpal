import type { SSEEvent, UserPreferences } from '@pawpal/shared';
import type { DbClient } from '../db/client.js';
import type { FastifyBaseLogger } from 'fastify';
import { intakeAgent } from './intakeAgent.js';
import { searchAgent, type SearchConfig } from './searchAgent.js';
import { matchingAgent } from './matchingAgent.js';
import { enrichmentAgent } from './enrichmentAgent.js';

export async function runPipeline(
  sessionId: string,
  answers: Record<string, unknown>,
  radius: number,
  db: DbClient,
  emitSSE: (event: SSEEvent) => void,
  log: FastifyBaseLogger,
  searchConfig: SearchConfig,
): Promise<void> {
  try {
    // Stage 1: Intake
    db.updateSessionStatus(sessionId, 'searching');
    const intake = await intakeAgent(answers);
    if (!intake.ok) {
      db.updateSessionStatus(sessionId, 'error');
      emitSSE({ type: 'pipeline_error', stage: 'intake', message: intake.error.message, code: intake.error.code, recoverable: intake.error.recoverable });
      return;
    }
    emitSSE({ type: 'progress', stage: 'intake', message: `Located: ${intake.data.locationLabel}` });

    // Save coordinates if available
    if (intake.data.coordinates) {
      db.saveCoordinates(sessionId, intake.data.coordinates.latitude, intake.data.coordinates.longitude);
    }

    // Stage 2: Search
    const search = await searchAgent(intake.data, radius, searchConfig);
    if (!search.ok) {
      db.updateSessionStatus(sessionId, 'error');
      emitSSE({ type: 'pipeline_error', stage: 'search', message: search.error.message, code: search.error.code, recoverable: search.error.recoverable });
      return;
    }

    if (search.data.warnings.length > 0) {
      emitSSE({ type: 'warning', stage: 'search', message: `Found ${search.data.pets.length} matches (some sources temporarily unavailable)`, warnings: search.data.warnings });
    } else {
      emitSSE({ type: 'progress', stage: 'search', message: `Found ${search.data.pets.length} potential matches nearby` });
    }

    // Stage 3: Matching
    const matching = await matchingAgent(search.data.pets, intake.data.validatedPrefs);
    emitSSE({ type: 'progress', stage: 'matching', message: `Ranked ${matching.data.length} pets by compatibility` });

    // Stage 4: Enrichment (top 20 only)
    const top20 = matching.data.slice(0, 20);
    const enriched = await enrichmentAgent(top20, intake.data.validatedPrefs);

    // Combine enriched top 20 with remaining scored pets (no explanations)
    const remaining = matching.data.slice(20).map((pet) => ({
      ...pet,
      breedPhotos: [] as string[],
      matchExplanation: null as string | null,
      strengthLabels: [] as string[],
    }));
    const finalResults = [...enriched.data, ...remaining];

    // Save & emit
    db.saveResults(sessionId, finalResults);
    db.updateSessionStatus(sessionId, search.data.warnings.length > 0 ? 'partial' : 'complete');
    emitSSE({ type: 'results_ready', stage: 'pipeline', message: 'Your matches are ready!' });

    log.info({ sessionId, resultCount: finalResults.length, warnings: search.data.warnings }, 'Pipeline completed');
  } catch (err) {
    log.error({ err, sessionId }, 'Pipeline unexpected failure');
    try {
      db.updateSessionStatus(sessionId, 'error');
    } catch {
      // DB write failed too — nothing we can do
    }
    emitSSE({ type: 'pipeline_error', stage: 'pipeline', code: 'UNKNOWN', message: 'Something went wrong. Please try again.', recoverable: true });
  }
}
