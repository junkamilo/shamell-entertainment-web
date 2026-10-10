import { describe, expect, it } from "vitest";
import { HEADER_MEDIA_PATH } from "@/features/admin/header-media/lib/headerMediaRoutes";

describe("headerMediaRoutes", () => {
  it("exports header media admin path", () => {
    expect(HEADER_MEDIA_PATH).toBe("/admin/header-media");
  });
});
