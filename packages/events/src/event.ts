import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { eventEnvelopeSchema, EVENT_VERSION } from './envelope.js';
import {
  runRequestedPayload,
  stepExecutePayload,
  stepCompletedPayload,
  stepFailedPayload,
  runCompletedPayload,
} from './payloads.js';

export class InvalidEventError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'InvalidEventError';
  }
}

const eventMap = {
  'run.requested': runRequestedPayload,
  'step.execute': stepExecutePayload,
  'step.completed': stepCompletedPayload,
  'step.failed': stepFailedPayload,
  'run.completed': runCompletedPayload,
} as const;

export type EventType = keyof typeof eventMap;
export type EventPayload<T extends EventType> = z.infer<(typeof eventMap)[T]>;

export type TypedEvent<T extends EventType> = {
  eventId: string;
  type: T;
  version: 1;
  occurredAt: string;
  runId: string;
  payload: EventPayload<T>;
};

export function createEvent<T extends EventType>(
  type: T,
  runId: string,
  payload: EventPayload<T>,
): TypedEvent<T> {
  const schema = eventMap[type];
  const parsed = schema.parse(payload);
  return {
    eventId: randomUUID(),
    type,
    version: EVENT_VERSION,
    occurredAt: new Date().toISOString(),
    runId,
    payload: parsed as EventPayload<T>,
  };
}

export function parseEvent(raw: unknown): TypedEvent<EventType> {
  const env = eventEnvelopeSchema.safeParse(raw);
  if (!env.success) {
    throw new InvalidEventError('Invalid envelope', env.error);
  }
  const type = env.data.type;
  if (!(type in eventMap)) {
    throw new InvalidEventError(`Unknown event type: ${type}`);
  }
  const payloadSchema = eventMap[type as EventType];
  const payload = payloadSchema.safeParse(env.data.payload);
  if (!payload.success) {
    throw new InvalidEventError(`Invalid payload for ${type}`, payload.error);
  }
  return { ...env.data, type, payload: payload.data } as TypedEvent<EventType>;
}

export function partitionKey(event: { runId: string }): string {
  return event.runId;
}
