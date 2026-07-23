import type { ServiceTypeItem } from "@/features/admin/service-types/types/serviceTypes.types";
import type { AdminService } from "../../types/services.types";
import {
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_ID_2,
  FIXTURE_SERVICE_TYPE_ID,
  FIXTURE_SERVICE_TYPE_ID_2,
} from "./uuids.fixture";

export function makeServiceType(
  overrides: Partial<ServiceTypeItem> = {},
): ServiceTypeItem {
  return {
    id: FIXTURE_SERVICE_TYPE_ID,
    name: "Performance",
    isActive: true,
    ...overrides,
  } as ServiceTypeItem;
}

export function makeAdminService(
  overrides: Partial<AdminService> = {},
): AdminService {
  return {
    id: FIXTURE_SERVICE_ID,
    serviceTypeId: FIXTURE_SERVICE_TYPE_ID,
    serviceTypeName: "Performance",
    description: "Private show package with dancers and staging.",
    items: ["Dance set", "Sound check"],
    price: 1500,
    imageUrl: "https://cdn.example.com/service.jpg",
    isActive: true,
    bookingCount: 0,
    galleryPhotoCount: 0,
    ...overrides,
  };
}

/** Payload for GET /api/v1/services/admin — also usable by catalog inquiry maps. */
export function makeAdminServicesApiPayload(
  items: Array<AdminService & { contactInquiryCode?: string }> = [
    {
      ...makeAdminService(),
      contactInquiryCode: "SHOW",
    },
    {
      ...makeAdminService({
        id: FIXTURE_SERVICE_ID_2,
        serviceTypeId: FIXTURE_SERVICE_TYPE_ID_2,
        serviceTypeName: "Private class",
        description: "One-on-one private class.",
        items: ["Lesson"],
        price: 200,
        isActive: false,
        imageUrl: null,
      }),
      contactInquiryCode: "CLASS",
    },
  ],
) {
  return items;
}

export function makeServiceTypesApiPayload(
  items: ServiceTypeItem[] = [
    makeServiceType(),
    makeServiceType({
      id: FIXTURE_SERVICE_TYPE_ID_2,
      name: "Private class",
      isActive: true,
    }),
  ],
) {
  return items;
}
