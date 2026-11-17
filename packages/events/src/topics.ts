export const TOPICS = {
  RUNS: 'workflow.runs',
  STEPS: 'workflow.steps',
  RESULTS: 'workflow.results',
  DLQ: 'workflow.steps.dlq',
} as const;

export const CONSUMER_GROUPS = {
  ORCHESTRATOR: 'flowforge-orchestrator',
  STEP_WORKERS: 'flowforge-step-workers',
} as const;
