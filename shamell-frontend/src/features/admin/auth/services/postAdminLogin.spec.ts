import { describe, expect, it } from "vitest";
import {
  FIXTURE_ACCESS_TOKEN,
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_PASSWORD,
} from "../test/fixtures/uuids.fixture";
import { postAdminLogin } from "./postAdminLogin";

describe("postAdminLogin", () => {
  it("returns ok with accessToken for fixture credentials", async () => {
    const { response, data } = await postAdminLogin(
      FIXTURE_ADMIN_EMAIL,
      FIXTURE_ADMIN_PASSWORD,
    );

    expect(response.ok).toBe(true);
    expect((data as { accessToken?: string }).accessToken).toBe(
      FIXTURE_ACCESS_TOKEN,
    );
  });

  it("returns !ok with Invalid admin credentials for wrong password", async () => {
    const { response, data } = await postAdminLogin(
      FIXTURE_ADMIN_EMAIL,
      "wrong-password",
    );

    expect(response.ok).toBe(false);
    expect((data as { message?: string }).message).toMatch(
      /Invalid admin credentials/,
    );
  });
});
