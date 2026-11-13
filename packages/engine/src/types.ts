export type StepType = 'HTTP_REQUEST' | 'TRANSFORM' | 'CONDITION' | 'DELAY';

export type RunStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
export type StepRunStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';

export interface StepDefinition {
  key: string;
  name: string;
  type: StepType;
  position: number;
  config: unknown;
}

export interface StepRunRecord {
  id: string;
  stepKey: string;
  stepType: StepType;
  position: number;
  status: StepRunStatus;
  input: unknown | null;
  output: unknown | null;
  error: string | null;
  attempt: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  durationMs: number | null;
}

export interface RunRecord {
  id: string;
  workflowId: string;
  status: RunStatus;
  input: unknown | null;
  output: unknown | null;
  definitionSnapshot: { steps: StepDefinition[] };
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface RunContext {
  trigger: unknown;
  steps: Record<string, unknown>;
}
