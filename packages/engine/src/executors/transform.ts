import type { RunContext } from '../types.js';
import { resolveTemplate } from '../template.js';

export async function transformExecutor(config: unknown, context: RunContext): Promise<unknown> {
  return resolveTemplate(config, context);
}
