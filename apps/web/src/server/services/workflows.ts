import { prisma } from '@flowforge/db';

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  steps: Array<{
    key: string;
    name: string;
    type: string;
    position: number;
    config: unknown;
  }>;
}

export async function createWorkflow(input: CreateWorkflowInput) {
  return prisma.workflow.create({
    data: {
      name: input.name,
      description: input.description,
      steps: { create: input.steps as never },
    },
    include: { steps: { orderBy: { position: 'asc' } } },
  });
}

export async function listWorkflows() {
  return prisma.workflow.findMany({
    orderBy: { createdAt: 'desc' },
    include: { steps: { orderBy: { position: 'asc' } } },
  });
}

export async function getWorkflow(id: string) {
  return prisma.workflow.findUnique({
    where: { id },
    include: { steps: { orderBy: { position: 'asc' } } },
  });
}
