import type { RouteContext } from '../types/http-request.types';

export type RequestContextStore = {
  requestId?: string;
  method?: string;
  url?: string;
  routeContext?: RouteContext;
  adminUserId?: string;
};
