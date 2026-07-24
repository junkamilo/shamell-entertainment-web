import type { OccasionTypeItem } from "../../types/occasionTypes.types";
import {
  FIXTURE_OCCASION_TYPE_ID,
  FIXTURE_OCCASION_TYPE_ID_2,
} from "./uuids.fixture";

export function makeOccasionTypeItem(
  overrides: Partial<OccasionTypeItem> = {},
): OccasionTypeItem {
  return {
    id: FIXTURE_OCCASION_TYPE_ID,
    name: "Birthday",
    isActive: true,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    bookingCount: 0,
    eventTypeLinkCount: 0,
    ...overrides,
  };
}

export function makeOccasionTypesApiPayload(
  items: OccasionTypeItem[] = [
    makeOccasionTypeItem(),
    makeOccasionTypeItem({
      id: FIXTURE_OCCASION_TYPE_ID_2,
      name: "Anniversary",
      isActive: false,
      eventTypeLinkCount: 1,
    }),
  ],
) {
  return items;
}
