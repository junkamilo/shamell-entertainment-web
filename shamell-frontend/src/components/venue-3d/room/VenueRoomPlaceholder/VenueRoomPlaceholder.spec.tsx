/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("../../carpet/RedCarpetRunner", () => ({
  default: () => <div data-testid="carpet" />,
}));

vi.mock("../../stage/VenueStage", () => ({
  default: () => <div data-testid="stage" />,
}));

vi.mock("../VenueWallSconces", () => ({
  default: () => <div data-testid="sconces" />,
}));

vi.mock("../VenueWoodFloor", () => ({
  default: () => <div data-testid="floor" />,
}));

import VenueRoomPlaceholder from "./VenueRoomPlaceholder";

describe("VenueRoomPlaceholder", () => {
  it("composes floor, stage, carpet, walls, and sconces", () => {
    const { getByTestId, container } = render(<VenueRoomPlaceholder />);
    expect(getByTestId("floor")).toBeInTheDocument();
    expect(getByTestId("stage")).toBeInTheDocument();
    expect(getByTestId("carpet")).toBeInTheDocument();
    expect(getByTestId("sconces")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-r3f="mesh"]').length).toBe(3);
  });

  it("forwards a mobile perf profile to sconces", () => {
    render(<VenueRoomPlaceholder perfProfile="mobile" />);
    expect(document.querySelector('[data-testid="sconces"]')).toBeTruthy();
  });
});
