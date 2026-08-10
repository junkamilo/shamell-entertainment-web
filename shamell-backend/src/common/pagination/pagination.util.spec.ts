import {
  buildLimitPaginationMeta,
  buildPaginationMeta,
} from './pagination.util';

describe('pagination.util', () => {
  it('buildPaginationMeta handles empty and multi-page', () => {
    expect(
      buildPaginationMeta({ page: 1, perPage: 10, totalItems: 0 }),
    ).toEqual({
      page: 1,
      perPage: 10,
      totalItems: 0,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    });

    expect(
      buildPaginationMeta({ page: 2, perPage: 10, totalItems: 25 }),
    ).toEqual({
      page: 2,
      perPage: 10,
      totalItems: 25,
      totalPages: 3,
      hasPrev: true,
      hasNext: true,
    });
  });

  it('buildLimitPaginationMeta uses limit field', () => {
    expect(
      buildLimitPaginationMeta({ page: 1, limit: 20, totalItems: 40 }),
    ).toEqual({
      page: 1,
      limit: 20,
      totalItems: 40,
      totalPages: 2,
      hasPrev: false,
      hasNext: true,
    });
  });
});
