import type { RunRecord, RunStatus, StepDefinition, StepRunRecord, StepRunStatus } from '../types';
import type { RunnerRepository } from '../repository';

export interface FakeRepoState {
  runs: Map<string, RunRecord>;
  stepRuns: Map<string, StepRunRecord>;
}

export function createFakeRepo(initialRun: RunRecord): {
  repo: RunnerRepository;
  state: FakeRepoState;
} {
  const state: FakeRepoState = {
    runs: new Map([[initialRun.id, { ...initialRun }]]),
    stepRuns: new Map(),
  };

  let nextId = 0;
  const newId = () => `sr_${nextId++}`;

  const repo: RunnerRepository = {
    async loadRun(runId) {
      const run = state.runs.get(runId);
      return run ? { ...run } : null;
    },

    async markRunRunning(runId, startedAt) {
      const run = state.runs.get(runId);
      if (!run) return;
      run.status = 'RUNNING';
      run.startedAt = startedAt;
    },

    async markRunFinished(runId, status, finishedAt, error) {
      const run = state.runs.get(runId);
      if (!run) return;
      run.status = status as RunStatus;
      run.finishedAt = finishedAt;
      run.error = error ?? null;
    },

    async createStepRun(input) {
      const record: StepRunRecord = {
        id: newId(),
        stepKey: input.step.key,
        stepType: input.step.type,
        position: input.step.position,
        status: input.status as StepRunStatus,
        input: null,
        output: null,
        error: null,
        attempt: 1,
        startedAt: input.startedAt,
        finishedAt: null,
        durationMs: null,
      };
      state.stepRuns.set(record.id, record);
      return { ...record };
    },

    async updateStepRun(stepRunId, patch) {
      const record = state.stepRuns.get(stepRunId);
      if (!record) return;
      Object.assign(record, patch);
    },
  };

  return { repo, state };
}

export function makeRun(overrides: Partial<RunRecord> & { steps: StepDefinition[] }): RunRecord {
  return {
    id: 'run_1',
    workflowId: 'wf_1',
    status: 'PENDING',
    input: null,
    output: null,
    error: null,
    startedAt: null,
    finishedAt: null,
    definitionSnapshot: { steps: overrides.steps },
    ...overrides,
  };
}

export function makeStep(
  overrides: Partial<StepDefinition> & { key: string; position: number },
): StepDefinition {
  return {
    name: overrides.key,
    type: 'TRANSFORM',
    config: {},
    ...overrides,
  } as StepDefinition;
}
