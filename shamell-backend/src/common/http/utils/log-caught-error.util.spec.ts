import {
  getRequestContext,
  runWithRequestContext,
} from '../context/request-context.als';
import { logCaughtError } from './log-caught-error.util';

describe('logCaughtError', () => {
  it('includes ALS context and op in JSON warn logs', () => {
    const warnCalls: unknown[][] = [];
    const errorCalls: unknown[][] = [];
    const logger = {
      warn: (...args: unknown[]) => {
        warnCalls.push(args);
      },
      error: (...args: unknown[]) => {
        errorCalls.push(args);
      },
    };

    runWithRequestContext(
      {
        requestId: 'req-1',
        method: 'POST',
        url: '/api/v1/contact',
        routeContext: { controller: 'ContactController', handler: 'create' },
        adminUserId: 'admin-1',
      },
      () => {
        logCaughtError(logger, new Error('mail failed'), {
          op: 'mail.ack',
          level: 'warn',
        });
      },
    );

    expect(warnCalls).toHaveLength(1);
    const first = warnCalls[0]?.[0];
    expect(typeof first).toBe('string');
    const logged = typeof first === 'string' ? first : '';
    expect(logged).toContain('"requestId":"req-1"');
    expect(logged).toContain('"op":"mail.ack"');
    expect(logged).toContain('"exceptionName":"Error"');
    expect(logged).toContain('"controller":"ContactController"');
    expect(errorCalls).toHaveLength(0);
    expect(getRequestContext()).toBeUndefined();
  });

  it('logs error level with stack', () => {
    const errorCalls: unknown[][] = [];
    const logger = {
      warn: () => undefined,
      error: (...args: unknown[]) => {
        errorCalls.push(args);
      },
    };
    const err = new Error('boom');
    logCaughtError(logger, err, { op: 'mail.send' });
    expect(errorCalls).toHaveLength(1);
    const stackArg = errorCalls[0]?.[1];
    expect(typeof stackArg === 'string' && stackArg.includes('Error')).toBe(
      true,
    );
  });
});
