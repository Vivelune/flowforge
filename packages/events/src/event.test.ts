import { describe, it, expect } from 'vitest';
import { createEvent, parseEvent, partitionKey, InvalidEventError } from './event';

describe('parseEvent', () => {
  it('round-trips a valid event', () => {
    const event = createEvent('run.requested', '00000000-0000-0000-0000-000000000001', {
      workflowId: '00000000-0000-0000-0000-000000000002',
      input: { userId: 'u1' },
    });
    const parsed = parseEvent(event);
    expect(parsed.type).toBe('run.requested');
    expect(parsed.runId).toBe(event.runId);
  });

  it('throws on missing required field', () => {
    expect(() => parseEvent({ type: 'run.requested' })).toThrow(InvalidEventError);
  });

  it('throws on unknown type', () => {
    expect(() =>
      parseEvent({
        eventId: '00000000-0000-0000-0000-000000000001',
        type: 'bogus.event',
        version: 1,
        occurredAt: new Date().toISOString(),
        runId: '00000000-0000-0000-0000-000000000001',
        payload: {},
      }),
    ).toThrow(InvalidEventError);
  });

  it('throws on wrong version', () => {
    expect(() =>
      parseEvent({
        eventId: '00000000-0000-0000-0000-000000000001',
        type: 'run.requested',
        version: 99,
        occurredAt: new Date().toISOString(),
        runId: '00000000-0000-0000-0000-000000000001',
        payload: {},
      }),
    ).toThrow(InvalidEventError);
  });
});

describe('partitionKey', () => {
  it('returns runId', () => {
    expect(partitionKey({ runId: 'abc' })).toBe('abc');
  });
});
