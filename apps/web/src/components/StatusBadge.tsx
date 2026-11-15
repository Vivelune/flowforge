import clsx from 'clsx';

const styles: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 ring-gray-300',
  RUNNING: 'bg-blue-100 text-blue-700 ring-blue-300',
  SUCCEEDED: 'bg-green-100 text-green-700 ring-green-300',
  FAILED: 'bg-red-100 text-red-700 ring-red-300',
  SKIPPED: 'bg-yellow-100 text-yellow-700 ring-yellow-300',
  ACTIVE: 'bg-green-100 text-green-700 ring-green-300',
  ARCHIVED: 'bg-gray-100 text-gray-700 ring-gray-300',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        styles[status] ?? 'bg-gray-100 text-gray-700 ring-gray-300',
      )}
    >
      {status}
    </span>
  );
}
