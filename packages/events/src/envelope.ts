import { z } from 'zod';

export const EVENT_VERSION = 1;

export const eventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  type: z.string().min(1),
  version: z.literal(EVENT_VERSION),
  occurredAt: z.string().datetime(),
  runId: z.string().uuid(),
  payload: z.unknown(),
});

export type EventEnvelope<T = unknown> = {
  eventId: string;
  type: string;
  version: typeof EVENT_VERSION;
  occurredAt: string;
  runId: string;
  payload: T;
};
