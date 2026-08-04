import { describe, expect, it } from "vitest";
import { CONTACTO_PATH as libContactoPath } from "@/lib/contacto/contactInquiryConstants";
import { CONTACTO_PATH } from "./contactoRoutes";

describe("contactoRoutes", () => {
  it("re-exports the public contact path from lib/contacto", () => {
    expect(CONTACTO_PATH).toBe("/contacto");
    expect(CONTACTO_PATH).toBe(libContactoPath);
  });
});
