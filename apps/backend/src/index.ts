import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { loadConfig } from './config.js';
import { DbClient, runMigrations, runStartupCleanup, startCleanupInterval } from './db/index.js';
import { healthRoutes, sessionRoutes } from './routes/index.js';

export async function buildApp(overrides?: { dbPath?: string }): Promise<{
  app: import('fastify').FastifyInstance;
  db: DbClient;
  sqlite: import('better-sqlite3').Database;
}> {
  const config = loadConfig();
  const dbPath = overrides?.dbPath ?? config.DB_PATH;

  // Pino logger
  const isTest = config.NODE_ENV === 'test';
  const app = Fastify({
    logger: isTest ? false : {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      redact: config.REDACT_PII
        ? ['req.headers.authorization', '*.apiKey', '*.secret', '*.token', '*.zipCode']
        : ['req.headers.authorization', '*.apiKey', '*.secret', '*.token'],
    },
    genReqId: () => crypto.randomUUID(),
  });

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: ["'self'"],
      },
    },
  });

  // CORS
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: false,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Database
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  runMigrations(sqlite);
  const db = new DbClient(sqlite);

  // Cleanup expired sessions
  runStartupCleanup(db, app.log);
  const cleanupTimer = startCleanupInterval(db, app.log);

  // Routes
  await app.register(async (instance) => {
    await healthRoutes(instance);
    await sessionRoutes(instance, db);
  });

  // Route-specific rate limits
  app.addHook('onRoute', (routeOptions) => {
    if (routeOptions.url === '/api/sessions' && routeOptions.method === 'POST') {
      routeOptions.config = { ...routeOptions.config, rateLimit: { max: 20, timeWindow: '1 minute' } };
    }
    if (routeOptions.url?.includes('/search') && routeOptions.method === 'POST') {
      routeOptions.config = { ...routeOptions.config, rateLimit: { max: 3, timeWindow: '5 minutes' } };
    }
  });

  // Global error handler
  app.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
    request.log.error({ err: error }, 'Unhandled error');

    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait and try again.' },
      });
    }

    return reply.status(error.statusCode ?? 500).send({
      error: { code: 'UNKNOWN', message: 'An unexpected error occurred' },
    });
  });

  // Cleanup on close
  app.addHook('onClose', () => {
    clearInterval(cleanupTimer);
    sqlite.close();
  });

  return { app, db, sqlite };
}

// Start server if run directly
const isMain = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js');
if (isMain) {
  const config = loadConfig();
  const { app } = await buildApp();
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
  } catch (err) {
    app.log.fatal(err);
    process.exit(1);
  }
}
