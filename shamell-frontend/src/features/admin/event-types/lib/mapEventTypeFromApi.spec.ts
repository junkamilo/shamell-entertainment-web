import { describe, expect, it } from "vitest";
import { mapEventTypeFromApi, mapEventTypesFromApi } from "./mapEventTypeFromApi";
import {
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
} from "../test/fixtures/uuids.fixture";

describe("mapEventTypeFromApi", () => {
  it("maps a full row", () => {
    expect(
      mapEventTypeFromApi({
        id: FIXTURE_EVENT_TYPE_ID,
        name: "Private weddings",
        isActive: true,
        catalogChannel: "BOOKING",
        contactInquiryCode: "PRIVATE",
        createdAt: "2026-07-20T12:00:00.000Z",
        updatedAt: "2026-07-20T12:00:00.000Z",
        eventCount: 2,
        bookingCount: 1,
        galleryPhotoCount: 3,
        occasionAssignments: [
          {
            occasionTypeId: FIXTURE_OCCASION_ID,
            usage: "OCCASION_SINGLE",
            sortOrder: 1,
            occasionName: "Birthday",
          },
        ],
      }),
    ).toEqual({
      id: FIXTURE_EVENT_TYPE_ID,
      name: "Private weddings",
      isActive: true,
      catalogChannel: "BOOKING",
      contactInquiryCode: "PRIVATE",
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
      eventCount: 2,
      bookingCount: 1,
      galleryPhotoCount: 3,
      occasionAssignments: [
        {
          occasionTypeId: FIXTURE_OCCASION_ID,
          usage: "OCCASION_SINGLE",
          sortOrder: 1,
          occasionName: "Birthday",
        },
      ],
    });
  });

  it("applies defaults for missing fields", () => {
    expect(mapEventTypeFromApi({ id: FIXTURE_EVENT_TYPE_ID, name: "X" })).toEqual({
      id: FIXTURE_EVENT_TYPE_ID,
      name: "X",
      isActive: false,
      catalogChannel: undefined,
      contactInquiryCode: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      eventCount: 0,
      bookingCount: 0,
      galleryPhotoCount: 0,
      occasionAssignments: undefined,
    });
  });

  it("preserves null contactInquiryCode and ignores invalid catalogChannel", () => {
    expect(
      mapEventTypeFromApi({
        id: FIXTURE_EVENT_TYPE_ID,
        name: "X",
        catalogChannel: "OTHER",
        contactInquiryCode: null,
      }),
    ).toMatchObject({
      catalogChannel: undefined,
      contactInquiryCode: null,
    });
  });
});

describe("mapEventTypesFromApi", () => {
  it("returns an empty array for non-array payloads", () => {
    expect(mapEventTypesFromApi(null)).toEqual([]);
    expect(mapEventTypesFromApi({})).toEqual([]);
    expect(mapEventTypesFromApi("x")).toEqual([]);
  });

  it("maps each row in an array", () => {
    const result = mapEventTypesFromApi([{ id: FIXTURE_EVENT_TYPE_ID, name: "Private weddings" }]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_EVENT_TYPE_ID);
  });
});
