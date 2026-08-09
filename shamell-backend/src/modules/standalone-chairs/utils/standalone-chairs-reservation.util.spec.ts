import { VenueSeatReservationStatus } from '@prisma/client';
import {
  makeLayoutChairItem,
  makePaidReservation,
} from '../__mocks__/standalone-chairs.fixtures';
import {
  buildChairPlacementMap,
  buildReservedLayoutItemMap,
  enrichChairWithReservationState,
  enrichChairsWithReservationState,
  paidReservationStatusWhere,
} from './standalone-chairs-reservation.util';

describe('standalone-chairs-reservation.util', () => {
  it('paidReservationStatusWhere filters PAID', () => {
    expect(paidReservationStatusWhere()).toEqual({
      status: VenueSeatReservationStatus.PAID,
    });
  });

  it('builds placement and reserved maps', () => {
    const placement = buildChairPlacementMap([makeLayoutChairItem()]);
    expect(placement.get('chair-1')).toBe('layout-item-1');

    const reserved = buildReservedLayoutItemMap([makePaidReservation()]);
    expect(reserved.get('layout-item-1')).toBe(VenueSeatReservationStatus.PAID);
  });

  it('enriches chair reservation flags', () => {
    const placement = buildChairPlacementMap([makeLayoutChairItem()]);
    const reserved = buildReservedLayoutItemMap([makePaidReservation()]);
    const flags = enrichChairWithReservationState(
      'chair-1',
      placement,
      reserved,
    );
    expect(flags.isReserved).toBe(true);
    expect(flags.canDelete).toBe(false);
    expect(flags.canEditPrice).toBe(false);
    expect(flags.isOnFloorPlan).toBe(true);
  });

  it('enrichChairsWithReservationState maps list', () => {
    const result = enrichChairsWithReservationState(
      [{ id: 'chair-1' }],
      buildChairPlacementMap([makeLayoutChairItem()]),
      [makePaidReservation()],
    );
    expect(result[0].isReserved).toBe(true);
  });
});
