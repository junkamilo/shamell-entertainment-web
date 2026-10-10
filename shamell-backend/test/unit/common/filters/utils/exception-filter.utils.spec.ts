import {
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { PUBLIC_INTERNAL_ERROR_MESSAGE } from '@app/common/filters/constants/exception-filter.constants';
import { buildClientErrorBody } from '@app/common/filters/utils/build-client-error-body.util';
import { buildExceptionLogPayload } from '@app/common/filters/utils/build-exception-log-payload.util';
import { resolveExceptionMeta } from '@app/common/filters/utils/resolve-exception-meta.util';

describe('resolveExceptionMeta', () => {
  it('resuelve el status y nombre de HttpException', () => {
    const meta = resolveExceptionMeta(new UnauthorizedException('nope'));
    expect(meta.status).toBe(401);
    expect(meta.exceptionName).toBe('UnauthorizedException');
    expect(meta.logMessage).toContain('nope');
  });

  it('asigna por defecto errores desconocidos a 500', () => {
    const meta = resolveExceptionMeta(new Error('prisma blew up'));
    expect(meta.status).toBe(500);
    expect(meta.exceptionName).toBe('Error');
    expect(meta.logMessage).toBe('prisma blew up');
    expect(meta.stack).toBeDefined();
  });
});

describe('buildClientErrorBody', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('preserva los objetos response de HttpException', () => {
    const body = buildClientErrorBody(
      new ForbiddenException({ statusCode: 403, message: 'denied' }),
      403,
    );
    expect(body).toEqual(
      expect.objectContaining({ statusCode: 403, message: 'denied' }),
    );
  });

  it('sanitiza cuerpos que no son HttpException en producción', () => {
    process.env.NODE_ENV = 'production';
    const body = buildClientErrorBody(new Error('secret db detail'), 500);
    expect(body).toEqual({
      statusCode: 500,
      message: PUBLIC_INTERNAL_ERROR_MESSAGE,
    });
  });

  it('expone Error.message fuera de producción', () => {
    process.env.NODE_ENV = 'development';
    const body = buildClientErrorBody(new Error('secret db detail'), 500);
    expect(body).toEqual({
      statusCode: 500,
      message: 'secret db detail',
    });
  });
});

describe('buildExceptionLogPayload', () => {
  it('mapea el contexto de la petición en un payload estable', () => {
    const meta = resolveExceptionMeta(new HttpException('boom', 500));
    const payload = buildExceptionLogPayload(
      {
        headers: {},
        method: 'GET',
        url: '/api/v1/about',
        requestId: 'req-1',
        routeContext: {
          controller: 'AboutController',
          handler: 'getAdmin',
        },
        adminUser: { id: 'admin-1' },
      },
      meta,
    );

    expect(payload).toEqual({
      requestId: 'req-1',
      method: 'GET',
      url: '/api/v1/about',
      status: 500,
      exceptionName: 'HttpException',
      controller: 'AboutController',
      handler: 'getAdmin',
      adminUserId: 'admin-1',
      message: 'boom',
    });
  });
});
