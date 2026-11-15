import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWorkflow } from '@/server/services/workflows';
import { StatusBadge } from '@/components/StatusBadge';
import { RunButton } from './RunButton';

export const dynamic = 'force-dynamic';

export default async function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = await getWorkflow(id);
  if (!workflow) notFound();

  return (
    <div className="space-y-6">
      <Link href="/workflows" className="text-sm text-gray-600 hover:underline">
        ← Workflows
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{workflow.name}</h1>
          {workflow.description && (
            <p className="mt-1 text-sm text-gray-600">{workflow.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={workflow.status} />
          <RunButton workflowId={workflow.id} />
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Steps</h2>
        <ol className="space-y-3">
          {workflow.steps.map((step) => (
            <li key={step.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500">#{step.position}</span>
                <span className="font-medium">{step.name}</span>
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                  {step.type}
                </code>
                <code className="ml-auto text-xs text-gray-500">{step.key}</code>
              </div>
              <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                {JSON.stringify(step.config, null, 2)}
              </pre>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
