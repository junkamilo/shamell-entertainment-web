import { Logger } from '@nestjs/common';
import { PROCESS_ERROR_LOGGER_CONTEXT } from './constants/process-error.constants';

function toErrorPayload(err: unknown, kind: string) {
  const exceptionName =
    err instanceof Error
      ? err.name
      : typeof err === 'object' &&
          err !== null &&
          'constructor' in err &&
          typeof (err as { constructor?: { name?: string } }).constructor
            ?.name === 'string'
        ? (err as { constructor: { name: string } }).constructor.name
        : 'UnknownError';
  const message = err instanceof Error ? err.message : String(err);
  return {
    kind,
    exceptionName,
    message,
  };
}

let registered = false;

/**
 * Registers once-per-process handlers for uncaught errors.
 * unhandledRejection: log only. uncaughtException: log + exit(1) in production.
 */
export function registerProcessErrorHandlers(
  logger: Pick<Logger, 'error'> = new Logger(PROCESS_ERROR_LOGGER_CONTEXT),
): void {
  if (registered) return;
  registered = true;

  process.on('unhandledRejection', (reason) => {
    const payload = toErrorPayload(reason, 'unhandledRejection');
    logger.error(
      JSON.stringify(payload),
      reason instanceof Error ? reason.stack : undefined,
    );
  });

  process.on('uncaughtException', (err) => {
    const payload = toErrorPayload(err, 'uncaughtException');
    logger.error(JSON.stringify(payload), err.stack);
    if ((process.env.NODE_ENV ?? 'development') === 'production') {
      process.exit(1);
    }
  });
}

/** Test-only: allow re-registering in isolated specs. */
export function resetProcessErrorHandlersForTests(): void {
  registered = false;
}
