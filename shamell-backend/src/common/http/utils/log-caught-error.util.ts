import type { Logger } from '@nestjs/common';
import { getRequestContext } from '../context/request-context.als';

export type LogCaughtErrorOptions = {
  op: string;
  level?: 'warn' | 'error';
  extra?: Record<string, unknown>;
};

function resolveExceptionName(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'constructor' in err &&
    typeof (err as { constructor?: { name?: string } }).constructor?.name ===
      'string' &&
    (err as { constructor: { name: string } }).constructor.name !== 'Object'
  ) {
    return (err as { constructor: { name: string } }).constructor.name;
  }
  if (err instanceof Error && err.name) return err.name;
  return 'UnknownError';
}

function resolveMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function logCaughtError(
  logger: Pick<Logger, 'warn' | 'error'>,
  err: unknown,
  options: LogCaughtErrorOptions,
): void {
  const ctx = getRequestContext();
  const level = options.level ?? 'error';
  const payload = {
    requestId: ctx?.requestId,
    method: ctx?.method,
    url: ctx?.url,
    controller: ctx?.routeContext?.controller,
    handler: ctx?.routeContext?.handler,
    adminUserId: ctx?.adminUserId,
    exceptionName: resolveExceptionName(err),
    message: resolveMessage(err),
    op: options.op,
    ...options.extra,
  };
  const json = JSON.stringify(payload);

  if (level === 'warn') {
    logger.warn(json);
    return;
  }

  logger.error(json, err instanceof Error ? err.stack : undefined);
}

/** Best-effort `.catch` handler that logs and returns null. */
export function softFailToNull(
  logger: Pick<Logger, 'warn' | 'error'>,
  op: string,
  level: 'warn' | 'error' = 'warn',
): (err: unknown) => null {
  return (err: unknown) => {
    logCaughtError(logger, err, { op, level });
    return null;
  };
}
