import { VenueSeatReservationStatus } from '@prisma/client';
import type { PlacedLayoutItem } from '../../floor-layout/types/floor-layout.types';
import type {
  BlockingStandaloneChairReservation,
  StandaloneChairConfigRow,
  StandaloneChairRow,
} from '../types/standalone-chairs.types';

const NOW = new Date('2026-01-15T12:00:00.000Z');

export function makeChairConfig(
  overrides: Partial<StandaloneChairConfigRow> = {},
): StandaloneChairConfigRow {
  return {
    id: 'config-1',
    availableQuantity: 2,
    unitPrice: 25,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeChairRow(
  overrides: Partial<StandaloneChairRow> = {},
): StandaloneChairRow {
  return {
    id: 'chair-1',
    chairName: 'CHAIR-abcd1234',
    unitPrice: 25,
    sortOrder: 0,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeLayoutChairItem(
  overrides: Partial<
    Extract<PlacedLayoutItem, { kind: 'standalone_chair' }>
  > = {},
): Extract<PlacedLayoutItem, { kind: 'standalone_chair' }> {
  return {
    id: 'layout-item-1',
    kind: 'standalone_chair',
    venueStandaloneChairId: 'chair-1',
    chairName: 'Chair',
    x: 10,
    y: 20,
    rotation: 0,
    ...overrides,
  };
}

export function makePaidReservation(
  overrides: Partial<BlockingStandaloneChairReservation> = {},
): BlockingStandaloneChairReservation {
  return {
    layoutItemId: 'layout-item-1',
    status: VenueSeatReservationStatus.PAID,
    ...overrides,
  };
}
