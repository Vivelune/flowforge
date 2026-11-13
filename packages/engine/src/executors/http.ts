import type { RunContext } from '../types.js';
import { httpConfigSchema } from '../schemas.js';
import { resolveTemplate } from '../template.js';

const MAX_RESPONSE_BYTES = 1024 * 1024;

export async function httpExecutor(config: unknown, context: RunContext): Promise<unknown> {
  const resolved = resolveTemplate(config, context) as Record<string, unknown>;
  const parsed = httpConfigSchema.parse(resolved);

  const url = new URL(parsed.url);
  if (['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)) {
    throw new Error(`HTTP executor refuses loopback URL: ${url.hostname}`);
  }

  const response = await fetch(url, {
    method: parsed.method,
    headers: parsed.headers,
    body: parsed.body !== undefined ? JSON.stringify(parsed.body) : undefined,
    signal: AbortSignal.timeout(parsed.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} from ${url}`);
  }

  const text = await response.text();
  if (text.length > MAX_RESPONSE_BYTES) {
    throw new Error(`Response exceeded ${MAX_RESPONSE_BYTES} bytes`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
