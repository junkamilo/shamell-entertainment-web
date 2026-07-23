import { http, HttpResponse } from "msw";
import { makeAdminAvailabilitySnapshot } from "../fixtures/disponibilidad.fixture";
import { FIXTURE_CLOSURE_SPECIFIC_ID } from "../fixtures/uuids.fixture";

export const disponibilidadHandlers = [
  http.get("*/api/v1/availability/admin", () => {
    return HttpResponse.json(makeAdminAvailabilitySnapshot());
  }),

  http.put("*/api/v1/availability/admin/weekly", async ({ request }) => {
    const body = (await request.json()) as { slots?: unknown };
    const snapshot = makeAdminAvailabilitySnapshot();
    if (Array.isArray(body.slots) && body.slots.length === 7) {
      return HttpResponse.json({
        ...snapshot,
        weekly: makeAdminAvailabilitySnapshot({
          weekly: snapshot.weekly.map((row, i) => ({
            ...row,
            ...(body.slots as Record<string, unknown>[])[i],
          })),
        }).weekly,
      });
    }
    return HttpResponse.json(snapshot);
  }),

  http.post("*/api/v1/availability/admin/closures", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: FIXTURE_CLOSURE_SPECIFIC_ID,
      ...(typeof body === "object" && body ? body : {}),
    });
  }),

  http.delete("*/api/v1/availability/admin/closures/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
