import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeAdminLoginUser } from "../test/fixtures/auth.fixture";
import {
  FIXTURE_ACCESS_TOKEN,
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_PASSWORD,
} from "../test/fixtures/uuids.fixture";
import { postAdminLogin } from "../services/postAdminLogin";
import { loginAdminAction } from "./authActions";

vi.mock("../services/postAdminLogin", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../services/postAdminLogin")>();
  return {
    ...actual,
    postAdminLogin: vi.fn(actual.postAdminLogin),
  };
});

describe("loginAdminAction", () => {
  beforeEach(() => {
    vi.mocked(postAdminLogin).mockClear();
  });

  it("returns ok with accessToken and user on success", async () => {
    const result = await loginAdminAction(
      FIXTURE_ADMIN_EMAIL,
      FIXTURE_ADMIN_PASSWORD,
    );

    expect(result).toEqual({
      ok: true,
      status: 200,
      accessToken: FIXTURE_ACCESS_TOKEN,
      user: makeAdminLoginUser(),
    });
  });

  it("returns ok false with message on bad credentials", async () => {
    const result = await loginAdminAction(
      FIXTURE_ADMIN_EMAIL,
      "wrong-password",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/Invalid admin credentials/);
    expect(result.status).toBe(401);
  });

  it("returns ok false when 200 body omits accessToken", async () => {
    server.use(
      http.post("*/api/v1/auth/admin/login", () =>
        HttpResponse.json({ user: makeAdminLoginUser() }),
      ),
    );

    const result = await loginAdminAction(
      FIXTURE_ADMIN_EMAIL,
      FIXTURE_ADMIN_PASSWORD,
    );

    expect(result).toEqual({
      ok: false,
      status: 200,
      message: "Invalid admin credentials.",
    });
  });

  it("returns status 0 when postAdminLogin throws", async () => {
    vi.mocked(postAdminLogin).mockRejectedValueOnce(new Error("network down"));

    const result = await loginAdminAction(
      FIXTURE_ADMIN_EMAIL,
      FIXTURE_ADMIN_PASSWORD,
    );

    expect(result).toEqual({
      ok: false,
      status: 0,
      message: "Cannot reach backend. Ensure API is running.",
    });
  });
});
