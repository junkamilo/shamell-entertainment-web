import type { ObservabilityHttpRequest } from '../../http/types/http-request.types';
import type {
  ExceptionLogPayload,
  ExceptionMeta,
} from '../types/exception-log.types';

export function buildExceptionLogPayload(
  request: ObservabilityHttpRequest,
  meta: ExceptionMeta,
): ExceptionLogPayload {
  return {
    requestId: request.requestId,
    method: request.method,
    url: request.url,
    status: meta.status,
    exceptionName: meta.exceptionName,
    controller: request.routeContext?.controller,
    handler: request.routeContext?.handler,
    adminUserId: request.adminUser?.id,
    message: meta.logMessage,
  };
}
