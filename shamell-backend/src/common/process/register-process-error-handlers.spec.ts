import {
  registerProcessErrorHandlers,
  resetProcessErrorHandlersForTests,
} from './register-process-error-handlers';

describe('registerProcessErrorHandlers', () => {
  afterEach(() => {
    resetProcessErrorHandlersForTests();
    process.removeAllListeners('unhandledRejection');
    process.removeAllListeners('uncaughtException');
  });

  it('logs unhandledRejection as JSON without exiting', () => {
    const errorCalls: unknown[][] = [];
    registerProcessErrorHandlers({
      error: (...args: unknown[]) => {
        errorCalls.push(args);
      },
    });

    process.emit(
      'unhandledRejection',
      new Error('reject-me'),
      Promise.resolve(),
    );

    expect(errorCalls).toHaveLength(1);
    const first = errorCalls[0]?.[0];
    expect(typeof first).toBe('string');
    const logged = typeof first === 'string' ? first : '';
    expect(logged).toContain('"kind":"unhandledRejection"');
    expect(logged).toContain('"message":"reject-me"');
  });
});
