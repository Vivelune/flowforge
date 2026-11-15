import Link from 'next/link';
import { listWorkflows } from '@/server/services/workflows';
import { StatusBadge } from '@/components/StatusBadge';
import { formatRelative } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function WorkflowsPage() {
  const workflows = await listWorkflows();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workflows</h1>
        <Link
          href="/workflows/new"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          New workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-600">No workflows yet.</p>
          <Link
            href="/workflows/new"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Create your first workflow
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Version</th>
                <th className="px-4 py-2 font-medium">Steps</th>
                <th className="px-4 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workflows.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/workflows/${w.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {w.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">v{w.version}</td>
                  <td className="px-4 py-3 text-gray-600">{w.steps.length}</td>
                  <td className="px-4 py-3 text-gray-600">{formatRelative(w.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
