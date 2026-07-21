export type PaginationMeta = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

/** Standard page meta used by bookings, contact, and admin list endpoints. */
export function buildPaginationMeta(params: {
  page: number;
  perPage: number;
  totalItems: number;
}): PaginationMeta {
  const { page, perPage, totalItems } = params;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
  return {
    page,
    perPage,
    totalItems,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

/** Stripe webhook audit list uses `limit` in query/meta instead of `perPage`. */
export function buildLimitPaginationMeta(params: {
  page: number;
  limit: number;
  totalItems: number;
}): {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
} {
  const { page, limit, totalItems } = params;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}
