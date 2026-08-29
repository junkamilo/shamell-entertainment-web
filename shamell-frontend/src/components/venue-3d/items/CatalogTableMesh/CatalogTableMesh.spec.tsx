/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

let frameCb: (() => void) | null = null;

vi.mock("@react-three/fiber", () => ({
  useFrame: (cb: () => void) => {
    frameCb = cb;
  },
}));

vi.mock("@react-three/drei", () => ({
  RoundedBox: () => null,
}));

vi.mock("../../chair/VenueBanquetChairMesh", () => ({
  default: () => <div data-testid="banquet-chair" />,
}));

import CatalogTableMesh from "./CatalogTableMesh";
import StandaloneChairMesh from "../StandaloneChairMesh";

describe("CatalogTableMesh / StandaloneChairMesh smoke", () => {
  it("mounts catalog table without throwing", () => {
    expect(() =>
      render(
        <CatalogTableMesh
          size="SMALL"
          includedChairs={2}
          selected
          reserved={false}
          renderChairs={false}
        />,
      ),
    ).not.toThrow();
  });

  it("renders chairs around the table", () => {
    const { getAllByTestId } = render(
      <CatalogTableMesh size="MEDIUM" includedChairs={4} selected reserved={false} />,
    );
    expect(getAllByTestId("banquet-chair").length).toBeGreaterThan(0);
  });

  it("skips spawn animation when scale is already 1", () => {
    render(<CatalogTableMesh size="LARGE" includedChairs={0} renderChairs={false} />);
    expect(() => frameCb?.()).not.toThrow();
  });

  it("animates spawn scale when below 1", () => {
    render(
      <CatalogTableMesh
        size="SMALL"
        includedChairs={0}
        spawnScale={0.2}
        renderChairs={false}
        perfProfile="mobile"
      />,
    );
    expect(() => frameCb?.()).not.toThrow();
  });

  it("mounts standalone chair without throwing", () => {
    expect(() =>
      render(<StandaloneChairMesh selected reserved={false} />),
    ).not.toThrow();
    expect(() =>
      render(<StandaloneChairMesh selected reserved perfProfile="mobile" />),
    ).not.toThrow();
  });

  it("uses reserved table materials", () => {
    expect(() =>
      render(
        <CatalogTableMesh
          size="SMALL"
          includedChairs={0}
          reserved
          selected
          renderChairs={false}
        />,
      ),
    ).not.toThrow();
  });
});
