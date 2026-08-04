import { describe, expect, it } from "vitest";
import { splitAboutParagraphs } from "./aboutParagraphs";

describe("splitAboutParagraphs", () => {
  it("splits on newlines and trims each paragraph", () => {
    expect(splitAboutParagraphs("One.\nTwo.\nThree.")).toEqual([
      "One.",
      "Two.",
      "Three.",
    ]);
  });

  it("skips empty lines and supports CRLF", () => {
    expect(splitAboutParagraphs("A\r\n\r\n  B  \n\nC")).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  it("returns an empty array for blank input", () => {
    expect(splitAboutParagraphs("")).toEqual([]);
    expect(splitAboutParagraphs("   \n  \n")).toEqual([]);
  });
});
