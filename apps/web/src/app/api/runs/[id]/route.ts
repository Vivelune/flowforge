import { NextResponse } from 'next/server';
import { getRun } from '@/server/services/runs';
import { fail } from '@/server/http';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) return fail('NOT_FOUND', 'Run not found', 404);
  return NextResponse.json(run);
}
