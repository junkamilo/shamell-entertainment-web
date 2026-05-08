export type PaginationMeta = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};

export const DEFAULT_PAGINATION_META: PaginationMeta = {
  page: 1,
  perPage: 10,
  totalItems: 0,
  totalPages: 1,
  hasPrev: false,
  hasNext: false,
};

export const PAGINATION_PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;
