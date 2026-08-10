import type { ArgumentsHost } from '@nestjs/common';
import type {
  ObservabilityHttpRequest,
  ObservabilityHttpResponse,
} from '../../http/types/http-request.types';

type MockResponse = ObservabilityHttpResponse & {
  statusCode?: number;
  body?: unknown;
  headers: Record<string, string>;
  setHeader: (name: string, value: string) => void;
};

export type MockExceptionHost = {
  host: ArgumentsHost;
  request: ObservabilityHttpRequest;
  response: MockResponse;
};

export function createArgumentsHostMock(
  requestOverrides: Partial<ObservabilityHttpRequest> = {},
): MockExceptionHost {
  const request: ObservabilityHttpRequest = {
    headers: {},
    method: 'GET',
    url: '/api/v1/test',
    requestId: 'test-request-id',
    ...requestOverrides,
  };

  const response: MockResponse = {
    headers: {},
    setHeader(this: MockResponse, name: string, value: string) {
      this.headers[name] = value;
    },
    status(this: MockResponse, code: number) {
      this.statusCode = code;
      return {
        json: (body: unknown) => {
          response.body = body;
        },
      };
    },
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, request, response };
}
