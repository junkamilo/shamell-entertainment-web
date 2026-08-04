import { describe, expect, it } from "vitest";
import {
  buildHeroWaveClipPathD,
  HERO_WAVE_MAX_BITE,
  heroWaveEdgeYNorm,
} from "./heroPearlWave";

describe("heroPearlWave", () => {
  it("keeps corners at y=1 and dips in the middle", () => {
    expect(heroWaveEdgeYNorm(0)).toBe(1);
    expect(heroWaveEdgeYNorm(1)).toBe(1);
    expect(heroWaveEdgeYNorm(0.5)).toBeLessThan(1);
    expect(heroWaveEdgeYNorm(0.5)).toBeGreaterThanOrEqual(0.9);
    expect(heroWaveEdgeYNorm(-1)).toBe(1);
    expect(heroWaveEdgeYNorm(2)).toBe(1);
  });

  it("exposes max bite constant used by pearl mapping", () => {
    expect(HERO_WAVE_MAX_BITE).toBe(0.042);
  });

  it("builds a closed SVG path for the hero clip", () => {
    const d = buildHeroWaveClipPathD(4);
    expect(d.startsWith("M 0 0 L 1 0")).toBe(true);
    expect(d.endsWith(" Z")).toBe(true);
    expect(d).toContain("L 0.00000 1.00000");
  });
});
