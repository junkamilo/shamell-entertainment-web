/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  AGENDA_HUB_PATH,
  ON_COMING_EVENTS_ADMIN_PATH,
  SERVICES_PATH,
} from "@/lib/admin/routes";
import { makeUpcomingEventsNavGroup } from "../test/fixtures/shell.fixture";

const pathnameMock = vi.fn(() => AGENDA_HUB_PATH);

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

import { useActiveRoute } from "./useActiveRoute";

describe("useActiveRoute", () => {
  it("exposes pathname and link active helper", () => {
    pathnameMock.mockReturnValue(`${AGENDA_HUB_PATH}/peticiones`);
    const { result } = renderHook(() => useActiveRoute());

    expect(result.current.pathname).toBe(`${AGENDA_HUB_PATH}/peticiones`);
    expect(result.current.isLinkActive(AGENDA_HUB_PATH)).toBe(true);
    expect(result.current.isLinkActive(SERVICES_PATH)).toBe(false);
  });

  it("detects active nav groups via children", () => {
    pathnameMock.mockReturnValue(ON_COMING_EVENTS_ADMIN_PATH);
    const { result } = renderHook(() => useActiveRoute());
    const group = makeUpcomingEventsNavGroup();

    expect(result.current.isGroupActive(group)).toBe(true);
  });
});
