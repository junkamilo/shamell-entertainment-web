import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { AttachRouteContextInterceptor } from './attach-route-context.interceptor';

describe('AttachRouteContextInterceptor', () => {
  it('sets controller and handler on the HTTP request', () => {
    const request: {
      routeContext?: { controller?: string; handler?: string };
    } = {};
    const context = {
      getType: () => 'http',
      getClass: () => ({ name: 'AboutController' }),
      getHandler: () => ({ name: 'getAdmin' }),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of(null) };
    const interceptor = new AttachRouteContextInterceptor();

    interceptor.intercept(context, next);

    expect(request.routeContext).toEqual({
      controller: 'AboutController',
      handler: 'getAdmin',
    });
  });
});
