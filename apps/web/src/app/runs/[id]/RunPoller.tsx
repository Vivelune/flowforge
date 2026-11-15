'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TERMINAL = new Set(['SUCCEEDED', 'FAILED']);

export function RunPoller({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (TERMINAL.has(status)) return;
    const interval = setInterval(() => {
      router.refresh();
    }, 2000);
    return () => clearInterval(interval);
  }, [status, router]);

  return null;
}
