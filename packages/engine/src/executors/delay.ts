import type { RunContext } from '../types.js';
import { delayConfigSchema } from '../schemas.js';
import { resolveTemplate } from '../template.js';

export async function delayExecutor(config: unknown, context: RunContext): Promise<unknown> {
  const resolved = resolveTemplate(config, context);
  const parsed = delayConfigSchema.parse(resolved);
  await new Promise((resolve) => setTimeout(resolve, parsed.seconds * 1000));
  return { waitedMs: parsed.seconds * 1000 };
}
