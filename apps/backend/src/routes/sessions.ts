import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DbClient } from '../db/client.js';

const CreateSessionBody = z.object({
  zipCode: z.string().regex(/^\d{5}$/).optional(),
});

const SessionIdParam = z.object({
  sessionId: z.string().uuid(),
});

const FavoritesBody = z.object({
  favorites: z.array(z.string()),
});

export async function sessionRoutes(app: FastifyInstance, db: DbClient): Promise<void> {
  // Create session
  app.post('/api/sessions', async (request, reply) => {
    const body = CreateSessionBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(422).send({
        error: { code: 'INVALID_PREFERENCES', message: 'Invalid request body', field: 'zipCode' },
      });
    }

    const id = crypto.randomUUID();
    db.createSession(id, body.data.zipCode);

    return reply.status(201).send({ id });
  });

  // Get session
  app.get('/api/sessions/:sessionId', async (request, reply) => {
    const params = SessionIdParam.safeParse(request.params);
    if (!params.success) {
      return reply.status(422).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Invalid session ID format' },
      });
    }

    const session = db.getSession(params.data.sessionId);
    if (!session) {
      return reply.status(404).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
      });
    }

    if (session.expires_at < Date.now()) {
      return reply.status(410).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Session has expired. Please start a new search.' },
      });
    }

    return {
      id: session.id,
      status: session.status,
      zipCode: session.zip_code,
      answers: session.answers_json ? JSON.parse(session.answers_json) : null,
      favorites: JSON.parse(session.favorites_json),
      createdAt: session.created_at,
      expiresAt: session.expires_at,
    };
  });

  // Update answers
  app.patch('/api/sessions/:sessionId/answers', async (request, reply) => {
    const params = SessionIdParam.safeParse(request.params);
    if (!params.success) {
      return reply.status(422).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Invalid session ID format' },
      });
    }

    const session = db.getSession(params.data.sessionId);
    if (!session) {
      return reply.status(404).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
      });
    }

    const existing = session.answers_json ? JSON.parse(session.answers_json) : {};
    const merged = { ...existing, ...(request.body as Record<string, unknown>) };
    db.saveAnswers(params.data.sessionId, merged);

    return { ok: true };
  });

  // Update favorites
  app.patch('/api/sessions/:sessionId/favorites', async (request, reply) => {
    const params = SessionIdParam.safeParse(request.params);
    if (!params.success) {
      return reply.status(422).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Invalid session ID format' },
      });
    }

    const body = FavoritesBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(422).send({
        error: { code: 'INVALID_PREFERENCES', message: 'favorites must be an array of strings' },
      });
    }

    const session = db.getSession(params.data.sessionId);
    if (!session) {
      return reply.status(404).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
      });
    }

    db.saveFavorites(params.data.sessionId, body.data.favorites);

    return { ok: true };
  });

  // Get results
  app.get('/api/sessions/:sessionId/results', async (request, reply) => {
    const params = SessionIdParam.safeParse(request.params);
    if (!params.success) {
      return reply.status(422).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Invalid session ID format' },
      });
    }

    const session = db.getSession(params.data.sessionId);
    if (!session) {
      return reply.status(404).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
      });
    }

    if (session.expires_at < Date.now()) {
      return reply.status(410).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Session has expired. Please start a new search.' },
      });
    }

    const results = db.getResults(params.data.sessionId);
    if (!results) {
      return reply.status(404).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'No results found for this session' },
      });
    }

    return { results };
  });

  // Trigger search (placeholder — Phase 3 will add the agent pipeline)
  app.post('/api/sessions/:sessionId/search', async (request, reply) => {
    const params = SessionIdParam.safeParse(request.params);
    if (!params.success) {
      return reply.status(422).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Invalid session ID format' },
      });
    }

    const session = db.getSession(params.data.sessionId);
    if (!session) {
      return reply.status(404).send({
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
      });
    }

    if (session.status === 'searching') {
      return reply.status(409).send({
        error: { code: 'UNKNOWN', message: 'A search is already in progress for this session' },
      });
    }

    db.updateSessionStatus(params.data.sessionId, 'searching');

    return reply.status(202).send({ message: 'Search started' });
  });
}
