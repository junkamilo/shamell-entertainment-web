import { http, HttpResponse } from "msw";
import { makeHomeAboveFoldApiPayload } from "../fixtures/homeLib.fixture";

/**
 * Aggregated home above-the-fold route used by `fetchHomeAboveFold`.
 * Legacy fallbacks reuse about / header-media / hooks / on-coming handlers.
 */
export const homeLibHandlers = [
  http.get("*/api/v1/home/above-fold", () => {
    return HttpResponse.json(makeHomeAboveFoldApiPayload());
  }),
];

export function homeAboveFoldHandler(
  payload: Parameters<typeof HttpResponse.json>[0] = makeHomeAboveFoldApiPayload(),
) {
  return http.get("*/api/v1/home/above-fold", () =>
    HttpResponse.json(payload),
  );
}

export function homeAboveFoldErrorHandler(status = 500) {
  return http.get("*/api/v1/home/above-fold", () =>
    HttpResponse.json({ message: "down" }, { status }),
  );
}
