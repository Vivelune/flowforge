import { z } from 'zod';

export const runRequestedPayload = z.object({
  workflowId: z.string().uuid(),
  input: z.unknown(),
});

export const stepExecutePayload = z.object({
  stepPosition: z.number().int().min(0),
  stepKey: z.string().min(1),
  attempt: z.number().int().min(1),
});

export const stepCompletedPayload = z.object({
  stepPosition: z.number().int().min(0),
  stepKey: z.string().min(1),
  durationMs: z.number().int().min(0),
  halt: z.boolean(),
});

export const stepFailedPayload = z.object({
  stepPosition: z.number().int().min(0),
  stepKey: z.string().min(1),
  attempts: z.number().int().min(1),
  error: z.object({
    message: z.string(),
    code: z.string(),
  }),
});

export const runCompletedPayload = z.object({
  status: z.enum(['SUCCEEDED', 'FAILED']),
  failedStepKey: z.string().nullable().optional(),
});
