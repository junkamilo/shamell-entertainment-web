import { REQUEST_ID_HEADER } from '../constants/http-headers.constants';
import { requestIdMiddleware } from './request-id.middleware';

describe('requestIdMiddleware', () => {
  it('generates a UUID when no header is present', () => {
    const req = { headers: {} as Record<string, string | undefined> };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req).toHaveProperty('requestId');
    expect(typeof (req as { requestId?: string }).requestId).toBe('string');
    expect((req as { requestId: string }).requestId.length).toBeGreaterThan(0);
    expect(res.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      (req as { requestId: string }).requestId,
    );
    expect(next).toHaveBeenCalled();
  });

  it('respects an incoming x-request-id header', () => {
    const req = {
      headers: { [REQUEST_ID_HEADER]: ' client-corr-1 ' },
    };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect((req as { requestId: string }).requestId).toBe('client-corr-1');
    expect(res.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      'client-corr-1',
    );
  });
});
