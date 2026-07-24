import { describe, expect, it } from "vitest";
import { makeServiceTypeItem } from "../test/fixtures/serviceTypes.fixture";
import {
  buildServiceTypeSubtitle,
  iconIndexForTypeName,
} from "./serviceTypesDisplay";

describe("iconIndexForTypeName", () => {
  it("returns a stable index in range", () => {
    const a = iconIndexForTypeName("Performance");
    const b = iconIndexForTypeName("Performance");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(8);
  });

  it("can differ across names", () => {
    expect(iconIndexForTypeName("Performance")).not.toBe(
      iconIndexForTypeName("Private class"),
    );
  });
});

describe("buildServiceTypeSubtitle", () => {
  it("describes unused types", () => {
    expect(buildServiceTypeSubtitle(makeServiceTypeItem())).toBe(
      "No linked services. You can hide or delete if you do not need it.",
    );
  });

  it("describes linked catalog services and blocks deactivate/delete", () => {
    expect(
      buildServiceTypeSubtitle(makeServiceTypeItem({ serviceCount: 1 })),
    ).toContain("1 catalog service");
    expect(
      buildServiceTypeSubtitle(makeServiceTypeItem({ serviceCount: 3 })),
    ).toContain("3 catalog services");
    expect(
      buildServiceTypeSubtitle(makeServiceTypeItem({ serviceCount: 1 })),
    ).toContain("Deactivate and delete are blocked");
  });

  it("describes linked gallery photos when no services", () => {
    expect(
      buildServiceTypeSubtitle(
        makeServiceTypeItem({ serviceCount: 0, galleryPhotoCount: 2 }),
      ),
    ).toContain("2 linked gallery photo(s)");
  });
});
