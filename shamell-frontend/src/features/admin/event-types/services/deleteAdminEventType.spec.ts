import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminEventType } from "./deleteAdminEventType";
import { FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAdminEventType", () => {
  it("resolves on success", async () => {
    await expect(deleteAdminEventType("token-1", FIXTURE_EVENT_TYPE_ID)).resolves.toBeUndefined();
  });

  it("throws delete message on 500", async () => {
    server.use(
      http.delete("*/api/v1/events/types/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(deleteAdminEventType("token-1", FIXTURE_EVENT_TYPE_ID)).rejects.toThrow(/nope/);
  });
});
