import { describe, expect, it } from "vitest";
import { makeNestErrorPayload } from "./test/fixtures/sharedLib.fixture";
import {
  FIXTURE_NEST_FALLBACK,
  FIXTURE_NEST_STRING_MESSAGE,
} from "./test/fixtures/uuids.fixture";
import { nestApiErrorMessage } from "./nestApiErrorMessage";

describe("nestApiErrorMessage", () => {
  it("returns fallback for non-objects", () => {
    expect(nestApiErrorMessage(null, FIXTURE_NEST_FALLBACK)).toBe(
      FIXTURE_NEST_FALLBACK,
    );
    expect(nestApiErrorMessage("x", FIXTURE_NEST_FALLBACK)).toBe(
      FIXTURE_NEST_FALLBACK,
    );
    expect(nestApiErrorMessage(undefined, FIXTURE_NEST_FALLBACK)).toBe(
      FIXTURE_NEST_FALLBACK,
    );
  });

  it("returns a trimmed string message", () => {
    expect(
      nestApiErrorMessage(
        makeNestErrorPayload(`  ${FIXTURE_NEST_STRING_MESSAGE}  `),
        FIXTURE_NEST_FALLBACK,
      ),
    ).toBe(FIXTURE_NEST_STRING_MESSAGE);
  });

  it("joins array messages with spaces", () => {
    expect(
      nestApiErrorMessage(
        makeNestErrorPayload(["A", "B", "C"]),
        FIXTURE_NEST_FALLBACK,
      ),
    ).toBe("A B C");
  });

  it("stringifies non-string array entries", () => {
    expect(
      nestApiErrorMessage(
        makeNestErrorPayload([1, { code: "x" }, "ok"]),
        FIXTURE_NEST_FALLBACK,
      ),
    ).toBe('1 {"code":"x"} ok');
  });

  it("returns fallback when message is missing or empty", () => {
    expect(nestApiErrorMessage({}, FIXTURE_NEST_FALLBACK)).toBe(
      FIXTURE_NEST_FALLBACK,
    );
    expect(
      nestApiErrorMessage(makeNestErrorPayload(""), FIXTURE_NEST_FALLBACK),
    ).toBe(FIXTURE_NEST_FALLBACK);
    expect(
      nestApiErrorMessage(makeNestErrorPayload([]), FIXTURE_NEST_FALLBACK),
    ).toBe(FIXTURE_NEST_FALLBACK);
    expect(
      nestApiErrorMessage(makeNestErrorPayload("   "), FIXTURE_NEST_FALLBACK),
    ).toBe(FIXTURE_NEST_FALLBACK);
  });
});
