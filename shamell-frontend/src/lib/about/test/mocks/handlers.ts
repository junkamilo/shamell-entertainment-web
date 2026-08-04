import { http, HttpResponse } from "msw";
import {
  makeAboutApiPayload,
  makeAboutContentItem,
} from "../fixtures/aboutLib.fixture";

/**
 * Public About routes used by `fetchPublicAbout` / home SSR helpers.
 * Prefer `aboutPublicHandler()` via `server.use` when a spec needs overrides.
 */
export const aboutLibHandlers = [
  http.get("*/api/v1/about", () => {
    return HttpResponse.json(makeAboutApiPayload());
  }),
];

export function aboutPublicHandler(
  payload: Parameters<typeof HttpResponse.json>[0] = makeAboutApiPayload(),
) {
  return http.get("*/api/v1/about", () => HttpResponse.json(payload));
}

export function aboutPublicContentHandler(
  item = makeAboutContentItem(),
) {
  return http.get("*/api/v1/about", () => HttpResponse.json(item));
}
