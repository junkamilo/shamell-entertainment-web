import { HttpException, HttpStatus } from '@nestjs/common';
import type { ExceptionMeta } from '../types/exception-log.types';

function resolveExceptionName(exception: unknown): string {
  if (
    typeof exception === 'object' &&
    exception !== null &&
    'constructor' in exception &&
    typeof (exception as { constructor?: { name?: string } }).constructor
      ?.name === 'string' &&
    (exception as { constructor: { name: string } }).constructor.name !==
      'Object'
  ) {
    return (exception as { constructor: { name: string } }).constructor.name;
  }
  if (exception instanceof Error && exception.name) {
    return exception.name;
  }
  return 'UnknownError';
}

function resolveLogMessage(exception: unknown): string {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null) {
      const message = (response as { message?: unknown }).message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.map(String).join('; ');
    }
    return exception.message;
  }
  if (exception instanceof Error) return exception.message;
  return String(exception);
}

export function resolveExceptionMeta(exception: unknown): ExceptionMeta {
  const status =
    exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

  return {
    status,
    exceptionName: resolveExceptionName(exception),
    logMessage: resolveLogMessage(exception),
    stack: exception instanceof Error ? exception.stack : undefined,
  };
}
