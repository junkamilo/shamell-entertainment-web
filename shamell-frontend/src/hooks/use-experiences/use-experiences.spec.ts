/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/test/server";
import { experienceServicesHandler } from "../test/mocks/handlers";
import { makeExperienceServiceApiItem } from "../test/fixtures/hooks.fixture";
import {
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_TYPE_NAME,
} from "../test/fixtures/uuids.fixture";
import { useExperiences } from "./use-experiences";

describe("useExperiences", () => {
  beforeEach(() => {
    server.use(experienceServicesHandler());
  });

  it("maps valid services into experiences", async () => {
    const { result } = renderHook(() => useExperiences(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.experiences[0]).toMatchObject({
      id: FIXTURE_SERVICE_ID,
      title: FIXTURE_SERVICE_TYPE_NAME,
      slug: "private-gala",
      heroMediaType: "IMAGE",
    });
  });

  it("skips fetch when disabled", async () => {
    const { result } = renderHook(() => useExperiences(false));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.experiences).toEqual([]);
  });

  it("filters invalid rows and recovers from API failure", async () => {
    server.use(
      experienceServicesHandler([
        makeExperienceServiceApiItem(),
        { id: "bad", serviceTypeName: "X" },
      ]),
    );
    const { result } = renderHook(() => useExperiences(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.experiences).toHaveLength(1);

    server.use(
      http.get("*/api/v1/services", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const { result: failed } = renderHook(() => useExperiences(true));
    await waitFor(() => expect(failed.current.isLoading).toBe(false));
    expect(failed.current.experiences).toEqual([]);
  });
});
