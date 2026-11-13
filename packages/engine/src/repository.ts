import type { RunRecord, StepDefinition, StepRunRecord, RunStatus, StepRunStatus } from './types';

export interface RunnerRepository {
  loadRun(runId: string): Promise<RunRecord | null>;
  markRunRunning(runId: string, startedAt: Date): Promise<void>;
  markRunFinished(
    runId: string,
    status: RunStatus,
    finishedAt: Date,
    error?: string | null,
  ): Promise<void>;

  createStepRun(input: {
    runId: string;
    step: StepDefinition;
    status: StepRunStatus;
    startedAt: Date | null;
  }): Promise<StepRunRecord>;
  updateStepRun(
    stepRunId: string,
    patch: Partial<
      Pick<
        StepRunRecord,
        'status' | 'input' | 'output' | 'error' | 'startedAt' | 'finishedAt' | 'durationMs'
      >
    >,
  ): Promise<void>;
}
