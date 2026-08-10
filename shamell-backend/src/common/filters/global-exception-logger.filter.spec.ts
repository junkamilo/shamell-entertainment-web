import { Logger, UnauthorizedException } from '@nestjs/common';
import { REQUEST_ID_HEADER } from '../http/constants/http-headers.constants';
import { createArgumentsHostMock } from './__mocks__/arguments-host.mock';
import { PUBLIC_INTERNAL_ERROR_MESSAGE } from './constants/exception-filter.constants';
import { GlobalExceptionLoggerFilter } from './global-exception-logger.filter';

describe('GlobalExceptionLoggerFilter', () => {
  const filter = new GlobalExceptionLoggerFilter();
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('logs 401 as warn with exceptionName and requestId', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const { host, response } = createArgumentsHostMock({
      requestId: 'req-401',
      routeContext: { controller: 'AuthController', handler: 'me' },
    });

    filter.catch(new UnauthorizedException('Missing token'), host);

    expect(response.statusCode).toBe(401);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logged = String(warnSpy.mock.calls[0]?.[0]);
    expect(logged).toContain('"exceptionName":"UnauthorizedException"');
    expect(logged).toContain('"requestId":"req-401"');
    expect(logged).toContain('"status":401');
    expect(errorSpy).not.toHaveBeenCalled();
    expect(response.headers[REQUEST_ID_HEADER]).toBe('req-401');
  });

  it('logs 500 Error with stack and sanitizes body in production', () => {
    process.env.NODE_ENV = 'production';
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const { host, response } = createArgumentsHostMock({
      requestId: 'req-500',
    });
    const boom = new Error('prisma blew up');

    filter.catch(boom, host);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      statusCode: 500,
      message: PUBLIC_INTERNAL_ERROR_MESSAGE,
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = String(errorSpy.mock.calls[0]?.[0]);
    expect(logged).toContain('"exceptionName":"Error"');
    expect(logged).toContain('"requestId":"req-500"');
    expect(logged).toContain('prisma blew up');
    expect(errorSpy.mock.calls[0]?.[1]).toEqual(
      expect.stringContaining('Error'),
    );
  });
});
