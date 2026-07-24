import type {
  StandaloneChairConfig,
  StandaloneChairInventoryItem,
} from "../../types/standaloneChairs.types";
import type { VenueTableConfig } from "../../types/venueTables.types";
import {
  FIXTURE_CHAIR_CONFIG_ID,
  FIXTURE_CHAIR_ID,
  FIXTURE_CHAIR_ID_2,
  FIXTURE_TABLE_ID,
  FIXTURE_TABLE_ID_2,
} from "./uuids.fixture";

export function makeVenueTable(
  overrides: Partial<VenueTableConfig> = {},
): VenueTableConfig {
  return {
    id: FIXTURE_TABLE_ID,
    tableName: "Large 1",
    displayLabel: "Large 1",
    size: "LARGE",
    includedChairs: 8,
    bundlePrice: 250,
    visualCoordinates: null,
    isActive: true,
    sortOrder: 0,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

export function makeVenueTablesApiPayload(
  items: VenueTableConfig[] = [
    makeVenueTable(),
    makeVenueTable({
      id: FIXTURE_TABLE_ID_2,
      tableName: "Medium 1",
      displayLabel: "Medium 1",
      size: "MEDIUM",
      includedChairs: 6,
      bundlePrice: 180,
      isActive: false,
      sortOrder: 1,
    }),
  ],
) {
  return items;
}

export function makeStandaloneChairItem(
  overrides: Partial<StandaloneChairInventoryItem> = {},
): StandaloneChairInventoryItem {
  return {
    id: FIXTURE_CHAIR_ID,
    chairName: "Chair 1",
    displayLabel: "Chair",
    unitPrice: 35,
    sortOrder: 0,
    isActive: true,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    isReserved: false,
    isOnFloorPlan: false,
    canDelete: true,
    canEditPrice: true,
    ...overrides,
  };
}

export function makeStandaloneChairConfig(
  overrides: Partial<StandaloneChairConfig> = {},
): StandaloneChairConfig {
  const chairs =
    overrides.chairs ??
    [
      makeStandaloneChairItem(),
      makeStandaloneChairItem({
        id: FIXTURE_CHAIR_ID_2,
        chairName: "Chair 2",
        sortOrder: 1,
        isReserved: true,
        reservationStatus: "PAID",
        canDelete: false,
        canEditPrice: false,
      }),
    ];
  return {
    id: FIXTURE_CHAIR_CONFIG_ID,
    availableQuantity: chairs.length,
    unitPrice: 35,
    updatedAt: "2026-07-20T12:00:00.000Z",
    isDefault: false,
    reservedCount: chairs.filter((c) => c.isReserved).length,
    totalCount: chairs.length,
    chairs,
    ...overrides,
  };
}
