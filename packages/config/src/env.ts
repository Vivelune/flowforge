import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url(),

  KAFKA_BROKERS: z.string().min(1),

  OPENAI_API_KEY: z.string().min(1).optional(),
});

export function validateServerEnv(env: Record<string, string | undefined> = process.env) {
  const result = serverEnvSchema.safeParse(env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(z.treeifyError(result.error));

    throw new Error('Environment validation failed');
  }

  return result.data;
}
