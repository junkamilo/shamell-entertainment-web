import {
  getRequestContext,
  patchRequestContext,
  runWithRequestContext,
} from './request-context.als';

describe('request-context.als', () => {
  it('exposes context inside runWithRequestContext', () => {
    expect(getRequestContext()).toBeUndefined();

    runWithRequestContext({ requestId: 'req-1', method: 'GET' }, () => {
      expect(getRequestContext()).toEqual({
        requestId: 'req-1',
        method: 'GET',
      });
      patchRequestContext({ adminUserId: 'admin-1' });
      expect(getRequestContext()?.adminUserId).toBe('admin-1');
    });

    expect(getRequestContext()).toBeUndefined();
  });

  it('patchRequestContext is a no-op outside ALS', () => {
    expect(() => patchRequestContext({ requestId: 'x' })).not.toThrow();
    expect(getRequestContext()).toBeUndefined();
  });
});
