import type { RunContext, StepType } from '../types';
import { httpExecutor } from './http';
import { transformExecutor } from './transform';
import { conditionExecutor } from './condition';
import { delayExecutor } from './delay';

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
