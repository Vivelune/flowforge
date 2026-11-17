import type { ZodSchema } from 'zod';

export function loadConfig<T>(schema: ZodSchema<T>, env: NodeJS.ProcessEnv = process.env): T {
  const result = schema.safeParse(env);
  if (!result.success) {
    console.error('Invalid configuration:', JSON.stringify(result.error.issues, null, 2));
    process.exit(1);
  }
  return result.data;
}
