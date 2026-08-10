import { AsyncLocalStorage } from 'async_hooks';
import type { RequestContextStore } from './request-context.types';

const requestContextAls = new AsyncLocalStorage<RequestContextStore>();

export function runWithRequestContext<T>(
  context: RequestContextStore,
  fn: () => T,
): T {
  return requestContextAls.run(context, fn);
}

export function getRequestContext(): RequestContextStore | undefined {
  return requestContextAls.getStore();
}

export function patchRequestContext(patch: Partial<RequestContextStore>): void {
  const store = requestContextAls.getStore();
  if (!store) return;
  Object.assign(store, patch);
}
