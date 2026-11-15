'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RunButton({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setRunning(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/runs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: {} }),
      });
      if (!res.ok) {
        setError(`Trigger failed (${res.status})`);
        return;
      }
      const body = await res.json();
      router.push(`/runs/${body.runId}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={running}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {running ? 'Starting…' : 'Run workflow'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
