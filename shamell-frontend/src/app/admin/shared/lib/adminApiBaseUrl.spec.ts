import { afterEach, describe, expect, it } from "vitest";
import { FIXTURE_BACKEND_URL } from "./test/fixtures/uuids.fixture";
import { getAdminApiBaseUrl } from "./adminApiBaseUrl";
import { getAdminApiBaseUrl as getLibAdminApiBaseUrl } from "@/lib/admin/apiBaseUrl";

describe("adminApiBaseUrl (app shared re-export)", () => {
  const original = process.env.NEXT_PUBLIC_BACKEND_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_BACKEND_URL;
    } else {
      process.env.NEXT_PUBLIC_BACKEND_URL = original;
    }
  });

  it("re-exports the same getAdminApiBaseUrl as @/lib/admin/apiBaseUrl", () => {
    expect(getAdminApiBaseUrl).toBe(getLibAdminApiBaseUrl);
  });

  it("defaults to localhost:3001 when env is unset", () => {
    delete process.env.NEXT_PUBLIC_BACKEND_URL;
    expect(getAdminApiBaseUrl()).toBe("http://localhost:3001");
  });

  it("strips a trailing slash from NEXT_PUBLIC_BACKEND_URL", () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = `${FIXTURE_BACKEND_URL}/`;
    expect(getAdminApiBaseUrl()).toBe(FIXTURE_BACKEND_URL);
  });

  it("returns the env origin as-is when there is no trailing slash", () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = FIXTURE_BACKEND_URL;
    expect(getAdminApiBaseUrl()).toBe(FIXTURE_BACKEND_URL);
  });
});
