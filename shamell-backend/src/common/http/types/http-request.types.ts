import type { AdminRequestUser } from '../../auth/types/admin-auth.types';

export type RouteContext = {
  controller?: string;
  handler?: string;
};

export type ObservabilityHttpRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
  routeContext?: RouteContext;
  adminUser?: Pick<AdminRequestUser, 'id'>;
};

export type ObservabilityHttpResponse = {
  status: (code: number) => { json: (body: unknown) => void };
  setHeader?: (name: string, value: string) => void;
};
