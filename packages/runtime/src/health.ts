import http from 'node:http';
import type { Logger } from './logger.js';

export type HealthCheck = () => Promise<boolean>;

export interface HealthServerOptions {
  port: number;
  checks: {
    ready: Array<{ name: string; fn: HealthCheck }>;
  };
  logger?: Logger;
}

export function startHealthServer(opts: HealthServerOptions): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/healthz') {
      res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
      return;
    }

    if (req.url === '/readyz') {
      const results = await Promise.all(
        opts.checks.ready.map(async ({ name, fn }) => {
          try {
            const ok = await fn();
            return { name, ok };
          } catch (err) {
            opts.logger?.error({ err, check: name }, 'readiness check failed');
            return { name, ok: false };
          }
        }),
      );

      const allOk = results.every((r) => r.ok);
      const body = allOk
        ? 'ready'
        : `not ready: ${results
            .filter((r) => !r.ok)
            .map((r) => r.name)
            .join(', ')}`;

      res.writeHead(allOk ? 200 : 503, { 'content-type': 'text/plain' }).end(body);
      return;
    }

    res.writeHead(404).end();
  });

  server.listen(opts.port, () => {
    opts.logger?.info({ port: opts.port }, 'health server listening');
  });

  return server;
}
