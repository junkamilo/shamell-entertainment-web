import {
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { PUBLIC_INTERNAL_ERROR_MESSAGE } from '../constants/exception-filter.constants';
import { buildClientErrorBody } from './build-client-error-body.util';
import { buildExceptionLogPayload } from './build-exception-log-payload.util';
import { resolveExceptionMeta } from './resolve-exception-meta.util';

describe('resolveExceptionMeta', () => {
  it('resolves HttpException status and name', () => {
    const meta = resolveExceptionMeta(new UnauthorizedException('nope'));
    expect(meta.status).toBe(401);
    expect(meta.exceptionName).toBe('UnauthorizedException');
    expect(meta.logMessage).toContain('nope');
  });

  it('defaults unknown errors to 500', () => {
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

  it('preserves HttpException response objects', () => {
    const body = buildClientErrorBody(
      new ForbiddenException({ statusCode: 403, message: 'denied' }),
      403,
    );
    expect(body).toEqual(
      expect.objectContaining({ statusCode: 403, message: 'denied' }),
    );
  });

  it('sanitizes non-HttpException bodies in production', () => {
    process.env.NODE_ENV = 'production';
    const body = buildClientErrorBody(new Error('secret db detail'), 500);
    expect(body).toEqual({
      statusCode: 500,
      message: PUBLIC_INTERNAL_ERROR_MESSAGE,
    });
  });

  it('exposes Error.message outside production', () => {
    process.env.NODE_ENV = 'development';
    const body = buildClientErrorBody(new Error('secret db detail'), 500);
    expect(body).toEqual({
      statusCode: 500,
      message: 'secret db detail',
    });
  });
});

describe('buildExceptionLogPayload', () => {
  it('maps request context into a stable payload', () => {
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
