import type { RunContext } from '../types';
import { resolveTemplate } from '../template';

export async function transformExecutor(config: unknown, context: RunContext): Promise<unknown> {
  return resolveTemplate(config, context);
}
