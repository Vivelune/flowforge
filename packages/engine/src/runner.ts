import type { RunContext, StepDefinition } from './types.js';
import type { RunnerRepository } from './repository.js';
import { registry } from './executors/registry.js';
import { resolveTemplate } from './template.js';
import type { ConditionResult } from './executors/condition.js';

export async function executeRun(runId: string, repo: RunnerRepository): Promise<void> {
  const run = await repo.loadRun(runId);
  if (!run) throw new Error(`Run ${runId} not found`);
  if (run.status !== 'PENDING') return;

  const startedAt = new Date();
  await repo.markRunRunning(runId, startedAt);

  const context: RunContext = { trigger: run.input ?? null, steps: {} };
  const steps = [...run.definitionSnapshot.steps].sort((a, b) => a.position - b.position);

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!;

      const stepRun = await repo.createStepRun({
        runId,
        step,
        status: 'RUNNING',
        startedAt: new Date(),
      });

      const stepStarted = Date.now();
      try {
        const executor = registry[step.type];
        if (!executor) throw new Error(`No executor for step type ${step.type}`);

        const resolvedInput = resolveTemplate(step.config, context);
        const result = await executor(step.config, context);

        // Handle CONDITION's stop signal
        let output: unknown = result;
        let stop = false;
        if (isConditionResult(result)) {
          output = result.output;
          stop = result.stop;
        }

        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - stepStarted;

        context.steps[step.key] = output;

        await repo.updateStepRun(stepRun.id, {
          status: 'SUCCEEDED',
          input: resolvedInput,
          output,
          finishedAt,
          durationMs,
        });

        if (stop) {
          // Mark the remaining steps SKIPPED
          for (const remaining of steps.slice(i + 1)) {
            await repo.createStepRun({
              runId,
              step: remaining,
              status: 'SKIPPED',
              startedAt: null,
            });
          }
          break;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - stepStarted;

        await repo.updateStepRun(stepRun.id, {
          status: 'FAILED',
          error: message,
          finishedAt,
          durationMs,
        });
        await repo.markRunFinished(runId, 'FAILED', finishedAt, message);
        return;
      }
    }

    const finishedAt = new Date();
    await repo.markRunFinished(runId, 'SUCCEEDED', finishedAt, null);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await repo.markRunFinished(runId, 'FAILED', new Date(), message);
  }
}

function isConditionResult(value: unknown): value is ConditionResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'output' in value &&
    'stop' in value &&
    typeof (value as ConditionResult).stop === 'boolean'
  );
}
