import { describe, expect, it } from "vitest";
import { makeServiceTypeItem } from "../test/fixtures/serviceTypes.fixture";
import {
  canDeleteServiceType,
  cannotDeactivateWhileActive,
  getDeactivateBlockedDescription,
  getDeleteBlockedDescription,
  getDeleteBlockedTitle,
} from "./serviceTypesUsage";

describe("serviceTypesUsage", () => {
  it("canDeleteServiceType requires zero services and gallery photos", () => {
    expect(canDeleteServiceType(makeServiceTypeItem())).toBe(true);
    expect(canDeleteServiceType(makeServiceTypeItem({ serviceCount: 1 }))).toBe(
      false,
    );
    expect(
      canDeleteServiceType(makeServiceTypeItem({ galleryPhotoCount: 1 })),
    ).toBe(false);
  });

  it("cannotDeactivateWhileActive when active with services", () => {
    expect(
      cannotDeactivateWhileActive(
        makeServiceTypeItem({ isActive: true, serviceCount: 1 }),
      ),
    ).toBe(true);
    expect(
      cannotDeactivateWhileActive(
        makeServiceTypeItem({ isActive: false, serviceCount: 1 }),
      ),
    ).toBe(false);
    expect(cannotDeactivateWhileActive(makeServiceTypeItem())).toBe(false);
  });

  it("builds deactivate blocked descriptions", () => {
    expect(
      getDeactivateBlockedDescription(makeServiceTypeItem({ serviceCount: 1 })),
    ).toContain("1 catalog service");
    expect(
      getDeactivateBlockedDescription(makeServiceTypeItem({ serviceCount: 3 })),
    ).toContain("3 catalog services");
  });

  it("builds delete blocked descriptions", () => {
    expect(
      getDeleteBlockedDescription(makeServiceTypeItem({ serviceCount: 1 })),
    ).toContain("before you can delete this type");
    expect(
      getDeleteBlockedDescription(makeServiceTypeItem({ serviceCount: 2 })),
    ).toContain("2 catalog services");
    expect(
      getDeleteBlockedDescription(
        makeServiceTypeItem({ serviceCount: 0, galleryPhotoCount: 1 }),
      ),
    ).toContain("1 gallery photo");
    expect(
      getDeleteBlockedDescription(
        makeServiceTypeItem({ serviceCount: 1, galleryPhotoCount: 2 }),
      ),
    ).toContain("gallery photo");
  });

  it("builds delete blocked titles", () => {
    expect(
      getDeleteBlockedTitle(makeServiceTypeItem({ serviceCount: 1 })),
    ).toBe("Linked services exist");
    expect(
      getDeleteBlockedTitle(
        makeServiceTypeItem({ serviceCount: 0, galleryPhotoCount: 1 }),
      ),
    ).toBe("Linked gallery photos exist");
  });
});
