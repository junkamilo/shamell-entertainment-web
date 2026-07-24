import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeContactLine } from "../test/fixtures/contacto.fixture";
import {
  FIXTURE_CONTACT_LINE_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
} from "../test/fixtures/uuids.fixture";
import { contactLinesListHandler } from "../test/mocks/handlers";
import { fetchPublicContactLines } from "./fetchPublicContactLines";

describe("fetchPublicContactLines", () => {
  it("loads and maps contact lines", async () => {
    server.use(contactLinesListHandler());

    const lines = await fetchPublicContactLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      id: FIXTURE_CONTACT_LINE_ID,
      eventTypeId: FIXTURE_EVENT_TYPE_ID,
      eventTypeName: "Private weddings",
      lineKind: "event",
      occasionSingle: [{ id: FIXTURE_OCCASION_ID, name: "Wedding" }],
    });
  });

  it("throws on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/events/contact-lines", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );

    await expect(fetchPublicContactLines()).rejects.toThrow("lines");
  });

  it("returns empty array when payload is not an array", async () => {
    server.use(
      http.get("*/api/v1/events/contact-lines", () => HttpResponse.json({ rows: [] })),
    );

    await expect(fetchPublicContactLines()).resolves.toEqual([]);
  });

  it("skips rows missing id or eventTypeId", async () => {
    server.use(
      contactLinesListHandler([
        makeContactLine({ id: "", eventTypeId: FIXTURE_EVENT_TYPE_ID }),
        makeContactLine({ id: FIXTURE_CONTACT_LINE_ID, eventTypeId: "" }),
        makeContactLine(),
      ]),
    );

    const lines = await fetchPublicContactLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.id).toBe(FIXTURE_CONTACT_LINE_ID);
  });

  it("maps event_type lineKind and numeric price", async () => {
    server.use(
      contactLinesListHandler([
        makeContactLine({
          lineKind: "event_type",
          price: "3200" as unknown as number,
          heroImageUrl: "  ",
          occasionBespokeProject: [{ id: FIXTURE_OCCASION_ID, name: "Film" }],
        }),
      ]),
    );

    const lines = await fetchPublicContactLines();
    expect(lines[0]).toMatchObject({
      lineKind: "event_type",
      price: 3200,
      heroImageUrl: undefined,
      occasionBespokeProject: [{ id: FIXTURE_OCCASION_ID, name: "Film" }],
    });
  });
});
