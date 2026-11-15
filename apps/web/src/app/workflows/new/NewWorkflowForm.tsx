'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_STEPS = JSON.stringify(
  [
    {
      key: 'fetch',
      name: 'Fetch',
      type: 'HTTP_REQUEST',
      position: 0,
      config: { method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1' },
    },
  ],
  null,
  2,
);

export function NewWorkflowForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let parsedSteps: unknown;
    try {
      parsedSteps = JSON.parse(steps);
    } catch (err) {
      setError(`Invalid JSON: ${(err as Error).message}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, steps: parsedSteps }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? `Request failed (${res.status})`);
        return;
      }
      const created = await res.json();
      router.push(`/workflows/${created.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Steps (JSON array)</label>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={16}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
        />
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create workflow'}
      </button>
    </form>
  );
}
