import { randomUUID } from 'crypto';
import { REQUEST_ID_HEADER } from '../constants/http-headers.constants';
import { runWithRequestContext } from '../context/request-context.als';
import type { ObservabilityHttpRequest } from '../types/http-request.types';

type RequestIdResponse = {
  setHeader: (name: string, value: string) => void;
};

function readIncomingRequestId(
  headers: ObservabilityHttpRequest['headers'],
): string | undefined {
  const raw = headers[REQUEST_ID_HEADER] ?? headers['X-Request-Id'];
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) {
    return raw[0].trim();
  }
  return undefined;
}

export function requestIdMiddleware(
  req: ObservabilityHttpRequest,
  res: RequestIdResponse,
  next: (err?: unknown) => void,
): void {
  const requestId = readIncomingRequestId(req.headers) ?? randomUUID();
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  runWithRequestContext(
    {
      requestId,
      method: req.method,
      url: req.url,
    },
    () => next(),
  );
}
