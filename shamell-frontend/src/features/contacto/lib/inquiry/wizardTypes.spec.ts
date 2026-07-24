import { describe, expect, it } from "vitest";
import { SERVICE_OPTION_UUID_RE } from "./wizardTypes";

const VALID_SERVICE_UUID = "11111111-1111-4111-8111-111111111111";

describe("wizardTypes", () => {
  describe("SERVICE_OPTION_UUID_RE", () => {
    it("accepts RFC4122 service UUIDs", () => {
      expect(SERVICE_OPTION_UUID_RE.test(VALID_SERVICE_UUID)).toBe(true);
    });

    it("rejects non-uuid strings", () => {
      expect(SERVICE_OPTION_UUID_RE.test("not-a-uuid")).toBe(false);
      expect(SERVICE_OPTION_UUID_RE.test("")).toBe(false);
    });

    it("rejects UUIDs with invalid variant nibble", () => {
      expect(
        SERVICE_OPTION_UUID_RE.test("00000000-0000-0000-0000-000000000000"),
      ).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(SERVICE_OPTION_UUID_RE.test(VALID_SERVICE_UUID.toUpperCase())).toBe(true);
    });
  });
});
