import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { patchRequestContext } from '../context/request-context.als';
import type { ObservabilityHttpRequest } from '../types/http-request.types';

@Injectable()
export class AttachRouteContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      const request = context
        .switchToHttp()
        .getRequest<ObservabilityHttpRequest>();
      const routeContext = {
        controller: context.getClass()?.name,
        handler: context.getHandler()?.name,
      };
      request.routeContext = routeContext;
      patchRequestContext({
        routeContext,
        requestId: request.requestId,
        method: request.method,
        url: request.url,
      });
    }
    return next.handle();
  }
}
