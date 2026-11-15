import Link from 'next/link';
import { NewWorkflowForm } from './NewWorkflowForm';

export default function NewWorkflowPage() {
  return (
    <div className="space-y-6">
      <Link href="/workflows" className="text-sm text-gray-600 hover:underline">
        ← Workflows
      </Link>
      <h1 className="text-2xl font-semibold">New workflow</h1>
      <NewWorkflowForm />
    </div>
  );
}
