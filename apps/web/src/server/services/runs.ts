import { prisma } from '@flowforge/db';
import type { StepDefinition } from '@flowforge/engine';

export interface TriggerRunInput {
  workflowId: string;
  input?: unknown;
}

export async function triggerRun({ workflowId, input }: TriggerRunInput) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: { orderBy: { position: 'asc' } } },
  });

  if (!workflow) return null;

  const snapshot = {
    steps: workflow.steps.map<StepDefinition>((s) => ({
      key: s.key,
      name: s.name,
      type: s.type as StepDefinition['type'],
      position: s.position,
      config: s.config,
    })),
  };

  return prisma.run.create({
    data: {
      workflowId: workflow.id,
      status: 'PENDING',
      input: input as never,
      definitionSnapshot: snapshot as never,
    },
  });
}

export async function listRuns(opts: { status?: string; cursor?: string; limit?: number }) {
  const limit = Math.min(opts.limit ?? 20, 100);
  return prisma.run.findMany({
    where: opts.status ? { status: opts.status as never } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
}

export async function getRun(id: string) {
  return prisma.run.findUnique({
    where: { id },
    include: { stepRuns: { orderBy: { position: 'asc' } } },
  });
}
