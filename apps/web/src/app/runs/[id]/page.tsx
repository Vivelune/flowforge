import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRun } from '@/server/services/runs';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDuration, formatRelative } from '@/lib/format';
import { RunPoller } from './RunPoller';

export const dynamic = 'force-dynamic';

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();

  return (
    <div className="space-y-6">
      <RunPoller status={run.status} />

      <Link href="/runs" className="text-sm text-gray-600 hover:underline">
        ← Runs
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-semibold">{run.id.slice(0, 12)}</h1>
          <p className="mt-1 text-sm text-gray-600">
            workflow{' '}
            <Link href={`/workflows/${run.workflowId}`} className="hover:underline">
              {run.workflowId.slice(0, 8)}
            </Link>{' '}
            · {formatRelative(run.startedAt ?? run.createdAt)}
          </p>
        </div>
        <StatusBadge status={run.status} />
      </div>

      {run.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{run.error}</div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Steps</h2>
        <ol className="space-y-3">
          {run.stepRuns.map((sr) => (
            <li key={sr.id} className="rounded-lg border border-gray-200 bg-white">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                  <span className="text-xs font-mono text-gray-500">#{sr.position}</span>
                  <span className="font-medium">{sr.stepKey}</span>
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                    {sr.stepType}
                  </code>
                  <StatusBadge status={sr.status} />
                  <span className="ml-auto text-xs text-gray-500">
                    {formatDuration(sr.durationMs)}
                  </span>
                </summary>
                <div className="space-y-2 border-t border-gray-100 px-4 py-3 text-xs">
                  {sr.error && <div className="rounded bg-red-50 p-2 text-red-700">{sr.error}</div>}
                  <div>
                    <div className="mb-1 font-semibold text-gray-700">Input</div>
                    <pre className="overflow-x-auto rounded bg-gray-50 p-2">
                      {JSON.stringify(sr.input, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-1 font-semibold text-gray-700">Output</div>
                    <pre className="overflow-x-auto rounded bg-gray-50 p-2">
                      {JSON.stringify(sr.output, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
