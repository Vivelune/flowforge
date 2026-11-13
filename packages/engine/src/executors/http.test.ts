import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { httpExecutor } from './http.js';
import type { RunContext } from '../types.js';

const emptyCtx: RunContext = { trigger: null, steps: {} };

describe('httpExecutor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed JSON on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    const out = await httpExecutor({ url: 'https://example.com' }, emptyCtx);
    expect(out).toEqual({ ok: true });
  });

  it('throws on non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('boom', { status: 500, statusText: 'Server Error' })),
    );
    await expect(httpExecutor({ url: 'https://example.com' }, emptyCtx)).rejects.toThrow(
      /HTTP 500/,
    );
  });

  it('returns plain text when JSON parse fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('hello', { status: 200 })));
    const out = await httpExecutor({ url: 'https://example.com' }, emptyCtx);
    expect(out).toBe('hello');
  });

  it('refuses loopback URLs', async () => {
    await expect(httpExecutor({ url: 'http://localhost:3000/api' }, emptyCtx)).rejects.toThrow(
      /loopback/,
    );
  });

  it('resolves templates in the URL before fetching', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await httpExecutor(
      { url: 'https://example.com/user/{{trigger.userId}}' },
      { trigger: { userId: '42' }, steps: {} },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ href: 'https://example.com/user/42' }),
      expect.anything(),
    );
  });
});
