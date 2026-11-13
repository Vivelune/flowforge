import type { RunContext } from '../types';
import { conditionConfigSchema } from '../schemas';
import { resolveTemplate } from '../template';

export interface ConditionResult {
  output: { passed: boolean };
  stop: boolean;
}

export async function conditionExecutor(
  config: unknown,
  context: RunContext,
): Promise<ConditionResult> {
  const resolved = resolveTemplate(config, context);
  const parsed = conditionConfigSchema.parse(resolved);

  const left = parsed.left;
  const right = parsed.right;
  let passed = false;

  switch (parsed.operator) {
    case 'eq':
      passed = JSON.stringify(left) === JSON.stringify(right);
      break;
    case 'neq':
      passed = JSON.stringify(left) !== JSON.stringify(right);
      break;
    case 'gt':
      passed = Number(left) > Number(right);
      break;
    case 'lt':
      passed = Number(left) < Number(right);
      break;
    case 'contains':
      passed =
        typeof left === 'string' && typeof right === 'string'
          ? left.includes(right)
          : Array.isArray(left)
            ? left.some((v) => JSON.stringify(v) === JSON.stringify(right))
            : false;
      break;
    case 'exists':
      passed = left !== undefined && left !== null;
      break;
  }

  return { output: { passed }, stop: !passed };
}
