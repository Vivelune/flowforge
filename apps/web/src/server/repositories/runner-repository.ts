import { prisma } from '@flowforge/db';
import type { RunnerRepository } from '@flowforge/engine';
import type { RunStatus, StepDefinition, StepRunStatus } from '@flowforge/engine';

export function createPrismaRunnerRepository(): RunnerRepository {
  return {
    async loadRun(runId) {
      const run = await prisma.run.findUnique({ where: { id: runId } });
      if (!run) return null;
      return {
        id: run.id,
        workflowId: run.workflowId,
        status: run.status as RunStatus,
        input: run.input,
        output: run.output,
        definitionSnapshot: run.definitionSnapshot as unknown as {
          steps: StepDefinition[];
        },
        error: run.error,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
      };
    },

    async markRunRunning(runId, startedAt) {
      await prisma.run.update({
        where: { id: runId },
        data: { status: 'RUNNING', startedAt },
      });
    },

    async markRunFinished(runId, status, finishedAt, error) {
      await prisma.run.update({
        where: { id: runId },
        data: {
          status: status as RunStatus,
          finishedAt,
          error: error ?? null,
        },
      });
    },

    async createStepRun(input) {
      const row = await prisma.stepRun.create({
        data: {
          runId: input.runId,
          stepKey: input.step.key,
          stepType: input.step.type,
          position: input.step.position,
          status: input.status as StepRunStatus,
          startedAt: input.startedAt,
        },
      });
      return {
        id: row.id,
        stepKey: row.stepKey,
        stepType: row.stepType,
        position: row.position,
        status: row.status as StepRunStatus,
        input: row.input,
        output: row.output,
        error: row.error,
        attempt: row.attempt,
        startedAt: row.startedAt,
        finishedAt: row.finishedAt,
        durationMs: row.durationMs,
      };
    },

    async updateStepRun(stepRunId, patch) {
      await prisma.stepRun.update({
        where: { id: stepRunId },
        data: {
          status: patch.status,
          input: patch.input as never,
          output: patch.output as never,
          error: patch.error,
          startedAt: patch.startedAt,
          finishedAt: patch.finishedAt,
          durationMs: patch.durationMs,
        },
      });
    },
  };
}
