/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@react-three/fiber", () => ({
  useFrame: () => {},
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

  it("mounts standalone chair without throwing", () => {
    expect(() =>
      render(<StandaloneChairMesh selected reserved={false} />),
    ).not.toThrow();
  });
});
