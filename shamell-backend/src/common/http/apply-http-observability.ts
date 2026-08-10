import type { INestApplication } from '@nestjs/common';
import { GlobalExceptionLoggerFilter } from '../filters/global-exception-logger.filter';
import { AttachRouteContextInterceptor } from './interceptors/attach-route-context.interceptor';
import { requestIdMiddleware } from './middleware/request-id.middleware';

/** Shared HTTP observability wiring used by main.ts and e2e. */
export function applyHttpObservability(app: INestApplication): void {
  app.use(requestIdMiddleware);
  app.useGlobalInterceptors(new AttachRouteContextInterceptor());
  app.useGlobalFilters(new GlobalExceptionLoggerFilter());
}
