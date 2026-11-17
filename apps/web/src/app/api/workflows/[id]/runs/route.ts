import { NextResponse } from 'next/server';
import { z } from 'zod';
import { triggerRun } from '@/server/services/runs';
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

  return NextResponse.json({ runId: run.id }, { status: 202 });
}
