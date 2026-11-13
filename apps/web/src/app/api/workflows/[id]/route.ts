import { NextResponse } from 'next/server';
import { getWorkflow } from '@/server/services/workflows';
import { fail } from '@/server/http';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = await getWorkflow(id);
  if (!workflow) return fail('NOT_FOUND', 'Workflow not found', 404);
  return NextResponse.json(workflow);
}
