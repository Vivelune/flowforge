import { describe, it, expect } from 'vitest';
import { executeRun } from './runner';
import { createFakeRepo, makeRun, makeStep } from './test/fake-repository';
import type { StepDefinition } from './types';

function steps(
  ...overrides: Array<Partial<StepDefinition> & { key: string; position: number }>
): StepDefinition[] {
  return overrides.map(makeStep);
}

describe('executeRun', () => {
  it('runs a happy path to SUCCEEDED', async () => {
    const run = makeRun({
      steps: steps(
        { key: 'a', position: 0, type: 'TRANSFORM', config: { value: 'x' } },
        { key: 'b', position: 1, type: 'TRANSFORM', config: { value: 'y' } },
      ),
    });
    const { repo, state } = createFakeRepo(run);
    await executeRun(run.id, repo);

    expect(state.runs.get(run.id)!.status).toBe('SUCCEEDED');
    const stepRuns = [...state.stepRuns.values()].sort((a, b) => a.position - b.position);
    expect(stepRuns).toHaveLength(2);
    expect(stepRuns.every((s) => s.status === 'SUCCEEDED')).toBe(true);
  });

  it('marks remaining steps SKIPPED when CONDITION fails', async () => {
    const run = makeRun({
      steps: steps(
        { key: 'a', position: 0, type: 'TRANSFORM', config: {} },
        {
          key: 'stop',
          position: 1,
          type: 'CONDITION',
          config: { left: 1, right: 2, operator: 'eq' }, // false → stop
        },
        { key: 'c', position: 2, type: 'TRANSFORM', config: {} },
      ),
    });
    const { repo, state } = createFakeRepo(run);
    await executeRun(run.id, repo);

    expect(state.runs.get(run.id)!.status).toBe('SUCCEEDED');
    const stepRuns = [...state.stepRuns.values()].sort((a, b) => a.position - b.position);
    expect(stepRuns[0]!.status).toBe('SUCCEEDED');
    expect(stepRuns[1]!.status).toBe('SUCCEEDED');
    expect(stepRuns[2]!.status).toBe('SKIPPED');
  });

  it('marks the run FAILED when a step throws', async () => {
    const run = makeRun({
      steps: steps(
        { key: 'ok', position: 0, type: 'TRANSFORM', config: {} },
        { key: 'boom', position: 1, type: 'HTTP_REQUEST', config: { url: 'not-a-url' } },
      ),
    });
    const { repo, state } = createFakeRepo(run);
    await executeRun(run.id, repo);

    const finished = state.runs.get(run.id)!;
    expect(finished.status).toBe('FAILED');
    expect(finished.error).toMatch(/url|URL/i);
    const boomRun = [...state.stepRuns.values()].find((s) => s.position === 1)!;
    expect(boomRun.status).toBe('FAILED');
  });

  it('does nothing if the run is already terminal', async () => {
    const run = makeRun({
      status: 'SUCCEEDED',
      steps: steps({ key: 'a', position: 0, type: 'TRANSFORM', config: {} }),
    });
    const { repo, state } = createFakeRepo(run);
    await executeRun(run.id, repo);
    expect(state.stepRuns.size).toBe(0);
  });
});
