import { describe, expect, it } from "vitest";
import {
  flattenLinkedOccasionIdsFromAssignments,
  formatLinkedOccasionLine,
  linkedOccasionIdsSignature,
  packLinkedOccasionsForApi,
} from "./eventTypesOccasionUtils";
import {
  makeOccasionCatalogItem,
} from "../test/fixtures/eventTypes.fixture";
import {
  FIXTURE_OCCASION_ID,
  FIXTURE_OCCASION_ID_2,
} from "../test/fixtures/uuids.fixture";

describe("eventTypesOccasionUtils", () => {
  describe("packLinkedOccasionsForApi", () => {
    it("sorts by catalog order and tags OCCASION_SINGLE", () => {
      const catalog = [
        makeOccasionCatalogItem({ id: FIXTURE_OCCASION_ID, name: "Birthday" }),
        makeOccasionCatalogItem({ id: FIXTURE_OCCASION_ID_2, name: "Anniversary" }),
      ];
      expect(
        packLinkedOccasionsForApi([FIXTURE_OCCASION_ID_2, FIXTURE_OCCASION_ID], catalog),
      ).toEqual([
        { occasionTypeId: FIXTURE_OCCASION_ID, usage: "OCCASION_SINGLE" },
        { occasionTypeId: FIXTURE_OCCASION_ID_2, usage: "OCCASION_SINGLE" },
      ]);
    });
  });

  describe("flattenLinkedOccasionIdsFromAssignments", () => {
    it("returns [] for missing assignments", () => {
      expect(flattenLinkedOccasionIdsFromAssignments(undefined)).toEqual([]);
      expect(flattenLinkedOccasionIdsFromAssignments([])).toEqual([]);
    });

    it("dedupes and sorts by usage then sortOrder", () => {
      expect(
        flattenLinkedOccasionIdsFromAssignments([
          {
            occasionTypeId: FIXTURE_OCCASION_ID_2,
            usage: "OCCASION_SINGLE",
            sortOrder: 1,
          },
          {
            occasionTypeId: FIXTURE_OCCASION_ID,
            usage: "BESPOKE_PROJECT",
            sortOrder: 0,
          },
          {
            occasionTypeId: FIXTURE_OCCASION_ID_2,
            usage: "OCCASION_SINGLE",
            sortOrder: 0,
          },
        ]),
      ).toEqual([FIXTURE_OCCASION_ID, FIXTURE_OCCASION_ID_2]);
    });
  });

  describe("formatLinkedOccasionLine", () => {
    it("returns null when there are no assignments", () => {
      expect(formatLinkedOccasionLine(undefined)).toBeNull();
      expect(formatLinkedOccasionLine([])).toBeNull();
    });

    it("joins unique occasion names", () => {
      expect(
        formatLinkedOccasionLine([
          {
            occasionTypeId: FIXTURE_OCCASION_ID,
            usage: "OCCASION_SINGLE",
            occasionName: "Birthday",
          },
          {
            occasionTypeId: FIXTURE_OCCASION_ID_2,
            usage: "OCCASION_SINGLE",
            occasionName: "Anniversary",
          },
          {
            occasionTypeId: FIXTURE_OCCASION_ID,
            usage: "OCCASION_SINGLE",
            occasionName: "Birthday",
          },
        ]),
      ).toBe("Birthday, Anniversary");
    });

    it("uses an ellipsis placeholder when name is missing", () => {
      expect(
        formatLinkedOccasionLine([
          { occasionTypeId: FIXTURE_OCCASION_ID, usage: "OCCASION_SINGLE" },
        ]),
      ).toBe("…");
    });
  });

  describe("linkedOccasionIdsSignature", () => {
    it("is order-independent", () => {
      expect(linkedOccasionIdsSignature([FIXTURE_OCCASION_ID_2, FIXTURE_OCCASION_ID])).toBe(
        linkedOccasionIdsSignature([FIXTURE_OCCASION_ID, FIXTURE_OCCASION_ID_2]),
      );
    });
  });
});
