import { describe, expect, it } from "vitest";
import { postAdminLogin } from "../services/postAdminLogin";
import {
  makeAdminLoginSuccessResponse,
  makeLoginActionSuccess,
} from "./fixtures/auth.fixture";
import {
  FIXTURE_ACCESS_TOKEN,
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_PASSWORD,
} from "./fixtures/uuids.fixture";
import { createMockAdminLoginState } from "./helpers/mockAdminLogin";

describe("auth test environment", () => {
  it("exposes usable fixtures and login mock", () => {
    expect(makeAdminLoginSuccessResponse().accessToken).toBe(FIXTURE_ACCESS_TOKEN);
    expect(makeLoginActionSuccess().ok).toBe(true);

    const state = createMockAdminLoginState({ isSubmitting: true });
    expect(state.isSubmitting).toBe(true);
    state.setEmail("x@y.z");
    expect(state.setEmail).toHaveBeenCalledWith("x@y.z");
  });

  it("serves admin login via MSW", async () => {
    const { response, data } = await postAdminLogin(
      FIXTURE_ADMIN_EMAIL,
      FIXTURE_ADMIN_PASSWORD,
    );
    expect(response.ok).toBe(true);
    expect((data as { accessToken?: string }).accessToken).toBe(
      FIXTURE_ACCESS_TOKEN,
    );
  });
});
