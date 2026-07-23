/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { makeAdminService } from "../test/fixtures/services.fixture";
import {
  FIXTURE_SERVICE_ID_2,
  FIXTURE_SERVICE_TYPE_ID,
  FIXTURE_SERVICE_TYPE_ID_2,
} from "../test/fixtures/uuids.fixture";
import { useServicesList } from "./useServicesList";

const twoServices = [
  makeAdminService({
    isActive: true,
    description: "Private show package with dancers and staging.",
    items: ["Dance set", "Sound check"],
    serviceTypeId: FIXTURE_SERVICE_TYPE_ID,
  }),
  makeAdminService({
    id: FIXTURE_SERVICE_ID_2,
    isActive: false,
    description: "One-on-one private class.",
    items: ["Lesson"],
    price: 200,
    serviceTypeId: FIXTURE_SERVICE_TYPE_ID_2,
    serviceTypeName: "Private class",
  }),
];

describe("useServicesList", () => {
  it("exposes stats, tabCounts, and single-page pagination for two services", () => {
    const { result } = renderHook(() => useServicesList({ services: twoServices }));

    expect(result.current.filteredServices).toHaveLength(2);
    expect(result.current.stats).toEqual({
      total: 2,
      active: 1,
      inactive: 1,
      itemsTotal: 3,
    });
    expect(result.current.tabCounts).toEqual({ all: 2, active: 1, inactive: 1 });
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedServices).toHaveLength(2);
  });

  it("filters by searchQuery against description text", () => {
    const { result } = renderHook(() => useServicesList({ services: twoServices }));

    act(() => {
      result.current.setSearchQuery("private class");
    });

    expect(result.current.filteredServices).toHaveLength(1);
    expect(result.current.filteredServices[0]?.id).toBe(FIXTURE_SERVICE_ID_2);
    expect(result.current.tabCounts).toEqual({ all: 1, active: 0, inactive: 1 });
  });

  it("filters by active and inactive tabs", () => {
    const { result } = renderHook(() => useServicesList({ services: twoServices }));

    act(() => {
      result.current.setFilterTab("active");
    });
    expect(result.current.filteredServices).toHaveLength(1);
    expect(result.current.filteredServices[0]?.isActive).toBe(true);

    act(() => {
      result.current.setFilterTab("inactive");
    });
    expect(result.current.filteredServices).toHaveLength(1);
    expect(result.current.filteredServices[0]?.isActive).toBe(false);
  });

  it("filters by typeFilterId", () => {
    const { result } = renderHook(() => useServicesList({ services: twoServices }));

    act(() => {
      result.current.setTypeFilterId(FIXTURE_SERVICE_TYPE_ID_2);
    });

    expect(result.current.filteredServices).toHaveLength(1);
    expect(result.current.filteredServices[0]?.serviceTypeId).toBe(
      FIXTURE_SERVICE_TYPE_ID_2,
    );
  });
});
