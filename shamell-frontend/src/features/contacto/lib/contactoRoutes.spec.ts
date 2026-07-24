import { describe, expect, it } from "vitest";
import { CONTACTO_PATH } from "./contactoRoutes";

describe("contactoRoutes", () => {
  it("exports public contact path", () => {
    expect(CONTACTO_PATH).toBe("/contacto");
  });
});
