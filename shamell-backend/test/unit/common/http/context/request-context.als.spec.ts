import {
  getRequestContext,
  patchRequestContext,
  runWithRequestContext,
} from '@app/common/http/context/request-context.als';

describe('request-context.als', () => {
  it('expone el contexto dentro de runWithRequestContext', () => {
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

  it('patchRequestContext no hace nada fuera de ALS', () => {
    expect(() => patchRequestContext({ requestId: 'x' })).not.toThrow();
    expect(getRequestContext()).toBeUndefined();
  });
});
