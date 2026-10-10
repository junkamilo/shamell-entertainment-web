import type { ServiceTypeItem } from "@/features/admin/service-types/types/serviceTypes.types";
import {
  FIXTURE_SERVICE_TYPE_ID,
  FIXTURE_SERVICE_TYPE_ID_2,
} from "@test/features/admin/service-types/support/fixtures/uuids.fixture";

export function makeServiceTypeItem(
  overrides: Partial<ServiceTypeItem> = {},
): ServiceTypeItem {
  return {
    id: FIXTURE_SERVICE_TYPE_ID,
    name: "Performance",
    isActive: true,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    serviceCount: 0,
    galleryPhotoCount: 0,
    ...overrides,
  };
}

export function makeServiceTypesApiPayload(
  items: ServiceTypeItem[] = [
    makeServiceTypeItem(),
    makeServiceTypeItem({
      id: FIXTURE_SERVICE_TYPE_ID_2,
      name: "Private class",
      isActive: false,
      serviceCount: 1,
      galleryPhotoCount: 0,
    }),
  ],
) {
  return items;
}
