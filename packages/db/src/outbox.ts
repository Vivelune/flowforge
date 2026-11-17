import type { Prisma } from './generated/client';
import { parseEvent } from '@flowforge/events';
import type { EventType, EventPayload } from '@flowforge/events';

export interface OutboxWriter {
  outboxEvent: {
    create: (args: Prisma.OutboxEventCreateArgs) => Promise<unknown>;
  };
}

export async function enqueueEvent<T extends EventType>(
  tx: OutboxWriter,
  event: {
    eventId: string;
    type: T;
    version: 1;
    occurredAt: string;
    runId: string;
    payload: EventPayload<T>;
  },
): Promise<void> {
  // Validate before writing. A malformed event should fail the transaction
  // immediately, not sit in the outbox waiting for the relay to choke on it.
  const validated = parseEvent(event);

  await tx.outboxEvent.create({
    data: {
      id: validated.eventId,
      topic: topicForType(validated.type),
      key: validated.runId,
      payload: validated as unknown as Prisma.InputJsonValue,
      headers: {
        'event-id': validated.eventId,
        'event-type': validated.type,
      },
    },
  });
}

function topicForType(type: EventType): string {
  switch (type) {
    case 'run.requested':
    case 'run.completed':
      return 'workflow.runs';
    case 'step.execute':
      return 'workflow.steps';
    case 'step.completed':
    case 'step.failed':
      return 'workflow.results';
  }
}
