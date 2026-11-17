import pino from 'pino';

export interface LoggerOptions {
  service: string;
  env: string;
  level?: string;
}

export function createLogger(opts: LoggerOptions) {
  return pino({
    level: opts.level ?? 'info',
    base: { service: opts.service, env: opts.env },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export type Logger = ReturnType<typeof createLogger>;

export function childLogger(logger: Logger, ctx: { runId?: string; eventId?: string }): Logger {
  return logger.child(ctx);
}
