import { http, HttpResponse } from "msw";
import {
  makeHeaderMediaApiPayload,
  makePublicHeaderPhoto,
} from "../fixtures/headerMediaLib.fixture";

/**
 * Public header-media routes used by `fetchPublicHeaderMedia`.
 * Prefer `headerMediaPublicHandler()` via `server.use` for overrides.
 */
export const headerMediaLibHandlers = [
  http.get("*/api/v1/header-media", () => {
    return HttpResponse.json(makeHeaderMediaApiPayload());
  }),
];

export function headerMediaPublicHandler(
  payload: Parameters<typeof HttpResponse.json>[0] = makeHeaderMediaApiPayload(),
) {
  return http.get("*/api/v1/header-media", () => HttpResponse.json(payload));
}

export function headerMediaPublicPhotosHandler(
  items = [makePublicHeaderPhoto()],
) {
  return http.get("*/api/v1/header-media", () => HttpResponse.json(items));
}
