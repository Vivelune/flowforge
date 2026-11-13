import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createWorkflow, listWorkflows } from '@/server/services/workflows';
import { fail } from '@/server/http';

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        key: z.string().min(1),
        name: z.string().min(1),
        type: z.enum(['HTTP_REQUEST', 'TRANSFORM', 'CONDITION', 'DELAY']),
        position: z.number().int().min(0),
        config: z.unknown(),
      }),
    )
    .min(1),
});

export async function GET() {
  const workflows = await listWorkflows();
  return NextResponse.json(workflows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return fail('VALIDATION', 'Invalid workflow payload', 400, parsed.error.flatten());
  }

  try {
    const workflow = await createWorkflow(parsed.data);
    return NextResponse.json(workflow, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail('WORKFLOW_CREATE_FAILED', message, 409);
  }
}
