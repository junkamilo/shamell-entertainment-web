import { REQUEST_ID_HEADER } from '@app/common/http/constants/http-headers.constants';
import { requestIdMiddleware } from '@app/common/http/middleware/request-id.middleware';

describe('requestIdMiddleware', () => {
  it('genera un UUID cuando no hay cabecera presente', () => {
    const req = { headers: {} as Record<string, string | undefined> };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req).toHaveProperty('requestId');
    expect(typeof (req as unknown as { requestId?: string }).requestId).toBe('string');
    expect((req as unknown as { requestId: string }).requestId.length).toBeGreaterThan(0);
    expect(res.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      (req as unknown as { requestId: string }).requestId,
    );
    expect(next).toHaveBeenCalled();
  });

  it('respeta la cabecera x-request-id entrante', () => {
    const req = {
      headers: { [REQUEST_ID_HEADER]: ' client-corr-1 ' },
    };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect((req as unknown as { requestId: string }).requestId).toBe('client-corr-1');
    expect(res.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      'client-corr-1',
    );
  });
});
