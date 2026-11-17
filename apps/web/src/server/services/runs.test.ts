import { describe, it, expect, vi } from 'vitest';
import { triggerRun, type TriggerRunDeps } from './runs';
import type { EventType, EventPayload } from '@flowforge/events';

type EnqueueArgs = {
  eventId: string;
  type: EventType;
  version: 1;
  occurredAt: string;
  runId: string;
  payload: EventPayload<EventType>;
};

function makeDeps(overrides: Partial<TriggerRunDeps> = {}): TriggerRunDeps {
  const tx = {
    run: {
      create: vi.fn(async () => ({ id: 'run-1' })),
    },
  };

  return {
    findWorkflow: vi.fn(async () => ({
      id: 'wf-1',
      steps: [],
    })) as never,
    transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)) as never,
    enqueue: vi.fn(async (_tx: unknown, _event: EnqueueArgs) => undefined) as never,
    createEvent: vi.fn((type: EventType, runId: string, payload: unknown) => ({
      eventId: 'evt-1',
      type,
      version: 1 as const,
      occurredAt: new Date().toISOString(),
      runId,
      payload,
    })) as never,
    ...overrides,
  };
}

describe('triggerRun', () => {
  it('does not create a Run when enqueueEvent throws', async () => {
    const deps = makeDeps({
      enqueue: vi.fn(async () => {
        throw new Error('simulated outbox failure');
      }) as never,
    });

    await expect(triggerRun({ workflowId: 'wf-1', input: {} }, deps)).rejects.toThrow(
      'simulated outbox failure',
    );
  });

  it('returns null when workflow does not exist', async () => {
    const deps = makeDeps({
      findWorkflow: vi.fn(async () => null) as never,
    });

    const result = await triggerRun({ workflowId: 'missing', input: {} }, deps);
    expect(result).toBeNull();
  });

  it('commits Run and enqueues run.requested on the happy path', async () => {
    const enqueue = vi.fn(async (_tx: unknown, _event: EnqueueArgs) => undefined);
    const deps = makeDeps({ enqueue: enqueue as never });

    const result = await triggerRun({ workflowId: 'wf-1', input: { userId: 'u1' } }, deps);

    expect(result).toEqual({ id: 'run-1' });
    expect(enqueue).toHaveBeenCalledOnce();

    const call = enqueue.mock.calls[0];
    if (!call) throw new Error('enqueue was not called');
    const event = call[1];

    expect(event.type).toBe('run.requested');
    expect(event.runId).toBe('run-1');
  });
});
