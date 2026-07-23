import { describe, expect, it } from "vitest";
import { mapAdminEventFromApi, mapAdminEventsFromApi } from "./mapAdminEventFromApi";
import {
  FIXTURE_CATALOG_IMAGE_ID,
  FIXTURE_EVENT_ID,
  FIXTURE_EVENT_TYPE_ID,
} from "../test/fixtures/uuids.fixture";

describe("mapAdminEventFromApi", () => {
  it("maps a full row", () => {
    expect(
      mapAdminEventFromApi({
        id: FIXTURE_EVENT_ID,
        eventTypeId: FIXTURE_EVENT_TYPE_ID,
        eventTypeName: "Private weddings",
        description: "An elegant private wedding package with full staging.",
        items: ["Dance set", "Sound check"],
        price: 2500,
        catalogImages: [
          {
            id: FIXTURE_CATALOG_IMAGE_ID,
            imageUrl: "https://cdn.example.com/event.jpg",
            mediaType: "image",
          },
        ],
        isActive: true,
        showOnHome: true,
        publicSection: "GENERAL",
        slug: "private-wedding",
        experienceType: null,
        classVariant: null,
        createdAt: "2026-07-20T12:00:00.000Z",
        updatedAt: "2026-07-20T12:00:00.000Z",
        bookingCount: 2,
        galleryPhotoCount: 1,
      }),
    ).toEqual({
      id: FIXTURE_EVENT_ID,
      eventTypeId: FIXTURE_EVENT_TYPE_ID,
      eventTypeName: "Private weddings",
      description: "An elegant private wedding package with full staging.",
      items: ["Dance set", "Sound check"],
      price: 2500,
      catalogImages: [
        {
          id: FIXTURE_CATALOG_IMAGE_ID,
          imageUrl: "https://cdn.example.com/event.jpg",
          mediaType: "image",
        },
      ],
      isActive: true,
      showOnHome: true,
      publicSection: "GENERAL",
      slug: "private-wedding",
      experienceType: null,
      classVariant: null,
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
      bookingCount: 2,
      galleryPhotoCount: 1,
    });
  });

  it("applies defaults for missing fields", () => {
    expect(mapAdminEventFromApi({ id: FIXTURE_EVENT_ID, eventTypeId: FIXTURE_EVENT_TYPE_ID })).toEqual({
      id: FIXTURE_EVENT_ID,
      eventTypeId: FIXTURE_EVENT_TYPE_ID,
      eventTypeName: "",
      description: "",
      items: [],
      price: null,
      catalogImages: [],
      isActive: false,
      showOnHome: true,
      publicSection: "GENERAL",
      slug: null,
      experienceType: null,
      classVariant: null,
      createdAt: undefined,
      updatedAt: undefined,
      bookingCount: 0,
      galleryPhotoCount: 0,
    });
  });

  it("coerces string price and maps upcoming experience fields", () => {
    expect(
      mapAdminEventFromApi({
        id: FIXTURE_EVENT_ID,
        eventTypeId: FIXTURE_EVENT_TYPE_ID,
        price: "99.5",
        publicSection: "UPCOMING_EVENTS",
        experienceType: "CLASSES",
        classVariant: "GROUP",
        items: "not-an-array",
      }),
    ).toMatchObject({
      price: 99.5,
      items: [],
      publicSection: "UPCOMING_EVENTS",
      experienceType: "CLASSES",
      classVariant: "GROUP",
    });
  });

  it("drops catalog images missing id or imageUrl", () => {
    expect(
      mapAdminEventFromApi({
        id: FIXTURE_EVENT_ID,
        eventTypeId: FIXTURE_EVENT_TYPE_ID,
        catalogImages: [
          { id: "", imageUrl: "https://cdn.example.com/a.jpg" },
          { id: FIXTURE_CATALOG_IMAGE_ID, imageUrl: "" },
          {
            id: FIXTURE_CATALOG_IMAGE_ID,
            imageUrl: "https://cdn.example.com/ok.jpg",
          },
        ],
      }).catalogImages,
    ).toEqual([
      {
        id: FIXTURE_CATALOG_IMAGE_ID,
        imageUrl: "https://cdn.example.com/ok.jpg",
        mediaType: undefined,
      },
    ]);
  });

  it("ignores invalid experienceType and classVariant values", () => {
    expect(
      mapAdminEventFromApi({
        id: FIXTURE_EVENT_ID,
        eventTypeId: FIXTURE_EVENT_TYPE_ID,
        experienceType: "OTHER",
        classVariant: "OTHER",
        publicSection: "OTHER",
      }),
    ).toMatchObject({
      experienceType: null,
      classVariant: null,
      publicSection: "GENERAL",
    });
  });
});

describe("mapAdminEventsFromApi", () => {
  it("returns an empty array for non-array payloads", () => {
    expect(mapAdminEventsFromApi(null)).toEqual([]);
    expect(mapAdminEventsFromApi({})).toEqual([]);
    expect(mapAdminEventsFromApi("x")).toEqual([]);
  });

  it("maps each row in an array", () => {
    const result = mapAdminEventsFromApi([
      { id: FIXTURE_EVENT_ID, eventTypeId: FIXTURE_EVENT_TYPE_ID },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_EVENT_ID);
  });
});
