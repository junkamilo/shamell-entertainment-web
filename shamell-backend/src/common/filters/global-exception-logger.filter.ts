import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { REQUEST_ID_HEADER } from '../http/constants/http-headers.constants';
import { getRequestContext } from '../http/context/request-context.als';
import type {
  ObservabilityHttpRequest,
  ObservabilityHttpResponse,
} from '../http/types/http-request.types';
import { buildClientErrorBody } from './utils/build-client-error-body.util';
import { buildExceptionLogPayload } from './utils/build-exception-log-payload.util';
import { resolveExceptionMeta } from './utils/resolve-exception-meta.util';

@Catch()
export class GlobalExceptionLoggerFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionLoggerFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ObservabilityHttpResponse>();
    const request = ctx.getRequest<ObservabilityHttpRequest>();
    const als = getRequestContext();

    if (!request.requestId && als?.requestId) {
      request.requestId = als.requestId;
    }
    if (!request.routeContext && als?.routeContext) {
      request.routeContext = als.routeContext;
    }

    const meta = resolveExceptionMeta(exception);
    const body = buildClientErrorBody(exception, meta.status);
    const payload = buildExceptionLogPayload(request, meta);
    const json = JSON.stringify(payload);

    if (meta.status >= 500) {
      this.logger.error(
        json,
        meta.stack ??
          (exception instanceof Error ? undefined : String(exception)),
      );
    } else if (meta.status >= 400) {
      this.logger.warn(json);
    }

    if (request.requestId && typeof response.setHeader === 'function') {
      response.setHeader(REQUEST_ID_HEADER, request.requestId);
    }

    response.status(meta.status).json(body);
  }
}
