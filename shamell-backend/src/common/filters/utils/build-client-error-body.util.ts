import { HttpException, HttpStatus } from '@nestjs/common';
import { PUBLIC_INTERNAL_ERROR_MESSAGE } from '../constants/exception-filter.constants';

function isProduction(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'production';
}

export function buildClientErrorBody(
  exception: unknown,
  status: number,
): Record<string, unknown> | object {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'object' && response !== null) {
      return response;
    }
    return {
      statusCode: status,
      message: typeof response === 'string' ? response : exception.message,
    };
  }

  if (isProduction()) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: PUBLIC_INTERNAL_ERROR_MESSAGE,
    };
  }

  const message =
    exception instanceof Error
      ? exception.message
      : PUBLIC_INTERNAL_ERROR_MESSAGE;

  return {
    statusCode: status,
    message,
  };
}
