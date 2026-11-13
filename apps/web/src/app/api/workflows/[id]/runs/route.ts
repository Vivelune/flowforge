import { NextResponse } from 'next/server';
import { z } from 'zod';
import { triggerRun } from '@/server/services/runs';
import { createPrismaRunnerRepository } from '@/server/repositories/runner-repository';
import { executeRun } from '@flowforge/engine';
import { fail } from '@/server/http';

const triggerSchema = z.object({ input: z.unknown().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = triggerSchema.safeParse(body);
  if (!parsed.success) {
    return fail('VALIDATION', 'Invalid run payload', 400, parsed.error.flatten());
  }

  const run = await triggerRun({ workflowId: id, input: parsed.data.input });
  if (!run) return fail('NOT_FOUND', 'Workflow not found', 404);

  // Deliberately naive fire-and-forget (ADR-002)
  const repo = createPrismaRunnerRepository();
  void executeRun(run.id, repo).catch((err) => {
    console.error('executeRun failed', err);
  });

  return NextResponse.json({ runId: run.id }, { status: 202 });
}
