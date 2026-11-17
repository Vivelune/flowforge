import type { Logger } from './logger.js';

type Cleanup = () => Promise<void>;

export interface ShutdownManager {
  register: (name: string, fn: Cleanup) => void;
  run: () => Promise<void>;
}

export function createShutdown(
  opts: {
    timeoutMs?: number;
    logger?: Logger;
  } = {},
): ShutdownManager {
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const tasks: Array<{ name: string; fn: Cleanup }> = [];
  let shuttingDown = false;

  async function run() {
    if (shuttingDown) return;
    shuttingDown = true;

    const deadline = setTimeout(() => {
      opts.logger?.error({ timeoutMs }, 'shutdown timed out, forcing exit');
      process.exit(1);
    }, timeoutMs);

    // Run cleanups in reverse registration order: producers disconnect before
    // their clients, servers stop accepting before their dependents close.
    for (const { name, fn } of [...tasks].reverse()) {
      try {
        opts.logger?.info({ step: name }, 'shutdown step');
        await fn();
      } catch (err) {
        opts.logger?.error({ err, step: name }, 'shutdown step failed');
      }
    }

    clearTimeout(deadline);
    opts.logger?.info('shutdown complete');
    process.exit(0);
  }

  process.on('SIGINT', run);
  process.on('SIGTERM', run);

  return {
    register(name, fn) {
      tasks.push({ name, fn });
    },
    run,
  };
}
