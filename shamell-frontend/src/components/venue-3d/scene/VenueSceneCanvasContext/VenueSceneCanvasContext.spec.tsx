/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  useVenueSceneCanvas,
  VenueSceneCanvasContext,
} from "./VenueSceneCanvasContext";

function ReadCanvas() {
  const { getCanvas, setOrbitEnabled } = useVenueSceneCanvas();
  return (
    <button type="button" onClick={() => setOrbitEnabled(false)}>
      {getCanvas() ? "has-canvas" : "no-canvas"}
    </button>
  );
}

describe("VenueSceneCanvasContext", () => {
  it("uses the default context", () => {
    render(<ReadCanvas />);
    expect(screen.getByText("no-canvas")).toBeInTheDocument();
    screen.getByRole("button").click();
  });

  it("reads a provided canvas handle", () => {
    const canvas = document.createElement("canvas");
    render(
      <VenueSceneCanvasContext.Provider
        value={{
          getCanvas: () => canvas,
          setOrbitEnabled: vi.fn(),
        }}
      >
        <ReadCanvas />
      </VenueSceneCanvasContext.Provider>,
    );
    expect(screen.getByText("has-canvas")).toBeInTheDocument();
  });
});
