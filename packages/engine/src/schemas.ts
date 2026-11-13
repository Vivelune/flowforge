import { z } from 'zod';

export const httpConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  timeoutMs: z.number().int().positive().max(30_000).default(10_000),
});

export const transformConfigSchema = z.record(z.unknown());

export const conditionConfigSchema = z.object({
  left: z.unknown(),
  right: z.unknown().optional(),
  operator: z.enum(['eq', 'neq', 'gt', 'lt', 'contains', 'exists']),
});

export const delayConfigSchema = z.object({
  seconds: z.number().positive().max(30),
});

export type HttpConfig = z.infer<typeof httpConfigSchema>;
export type TransformConfig = z.infer<typeof transformConfigSchema>;
export type ConditionConfig = z.infer<typeof conditionConfigSchema>;
export type DelayConfig = z.infer<typeof delayConfigSchema>;
