import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DB_PATH: z.string().default('./data/pawpal.db'),

  RESCUE_GROUPS_API_KEY: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().default(''),

  REDACT_PII: z.coerce.boolean().default(false),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse(process.env);
}
