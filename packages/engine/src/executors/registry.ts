import type { RunContext, StepType } from '../types.js';
import { httpExecutor } from './http.js';
import { transformExecutor } from './transform.js';
import { conditionExecutor } from './condition.js';
import { delayExecutor } from './delay.js';

export interface ExecutorResult {
  output: unknown;
  stop?: boolean;
}

export type Executor = (config: unknown, context: RunContext) => Promise<unknown | ExecutorResult>;

export const registry: Record<StepType, Executor> = {
  HTTP_REQUEST: httpExecutor,
  TRANSFORM: transformExecutor,
  CONDITION: conditionExecutor,
  DELAY: delayExecutor,
};
