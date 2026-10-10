import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { AttachRouteContextInterceptor } from '@app/common/http/interceptors/attach-route-context.interceptor';

describe('AttachRouteContextInterceptor', () => {
  it('asigna el controller y handler en la petición HTTP', () => {
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
