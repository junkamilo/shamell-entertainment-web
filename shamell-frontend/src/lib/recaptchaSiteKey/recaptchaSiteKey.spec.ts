import { afterEach, describe, expect, it } from "vitest";
import { getRecaptchaSiteKey } from "./recaptchaSiteKey";

describe("getRecaptchaSiteKey", () => {
  const original = process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY;
    } else {
      process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY = original;
    }
  });

  it("returns empty string when env is unset", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY;
    expect(getRecaptchaSiteKey()).toBe("");
  });

  it("trims NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY", () => {
    process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY = "  site-key-1  ";
    expect(getRecaptchaSiteKey()).toBe("site-key-1");
  });
});
