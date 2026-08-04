import { describe, expect, it } from "vitest";
import { MODAL_LAYERS } from "./modalLayers";

describe("MODAL_LAYERS", () => {
  it("exposes stable stacking classes", () => {
    expect(MODAL_LAYERS.overlay).toBe("z-200");
    expect(MODAL_LAYERS.mediaPreview).toBe("z-[205]");
    expect(MODAL_LAYERS.nestedPicker).toBe("z-[210]");
    expect(MODAL_LAYERS.busy).toBe("z-[220]");
  });
});
