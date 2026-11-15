import Link from 'next/link';
import { listRuns } from '@/server/services/runs';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDuration, formatRelative } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const sp = await searchParams;
  const limit = 20;
  const rows = await listRuns({ status: sp.status, cursor: sp.cursor, limit });
  const hasMore = rows.length > limit;
  const runs = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? runs[runs.length - 1]!.id : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Runs</h1>

      {runs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-sm text-gray-600">
          No runs yet. Trigger one from a workflow.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Run</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Started</th>
                  <th className="px-4 py-2 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runs.map((r) => {
                  const duration =
                    r.startedAt && r.finishedAt
                      ? new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()
                      : null;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link href={`/runs/${r.id}`} className="hover:underline">
                          {r.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatRelative(r.startedAt ?? r.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDuration(duration)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="text-center">
              <Link
                href={`/runs?cursor=${nextCursor}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Next page →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
