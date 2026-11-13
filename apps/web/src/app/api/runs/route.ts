import { NextResponse } from 'next/server';
import { listRuns } from '@/server/services/runs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const limit = Number(url.searchParams.get('limit') ?? '20');

  const rows = await listRuns({ status, cursor, limit });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1]!.id : null,
  });
}
