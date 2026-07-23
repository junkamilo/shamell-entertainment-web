import {
  classPriceHeroAriaLabel,
  computeClassPriceDisplay,
  formatClassPriceHeroLabel,
  formatClassPriceHeroPrefix,
} from "./computeClassPriceDisplay";

describe("computeClassPriceDisplay", () => {
  it("returns min/max from session prices", () => {
    expect(
      computeClassPriceDisplay(
        [{ price: 25 }, { price: 40 }, { price: 30 }],
        20,
      ),
    ).toEqual({ from: 25, to: 40 });
  });

  it("falls back to event base price when no sessions", () => {
    expect(computeClassPriceDisplay([], 35)).toEqual({ from: 35, to: 35 });
  });

  it("returns null when no usable prices", () => {
    expect(computeClassPriceDisplay([], null)).toBeNull();
    expect(computeClassPriceDisplay([{ price: 0 }], null)).toBeNull();
  });

  it("formats single price without From prefix", () => {
    const range = { from: 50, to: 50 };
    expect(formatClassPriceHeroPrefix(range)).toBe("");
    expect(formatClassPriceHeroLabel(range)).toBe("50");
    expect(classPriceHeroAriaLabel(range)).toBe("Price 50 USD");
  });

  it("formats range with From prefix", () => {
    const range = { from: 20, to: 45 };
    expect(formatClassPriceHeroPrefix(range)).toBe("From ");
    expect(formatClassPriceHeroLabel(range)).toBe("20 – 45");
    expect(classPriceHeroAriaLabel(range)).toBe("Price from 20 to 45 USD");
  });
});
