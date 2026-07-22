/**
 * Manual QA checklist for Agendar pre-production.
 * Copy results into your PR or ticket when executing Fase 4.
 *
 * Automated verification (2026-06-30):
 * - npm run test:agendar — 36/36 passed
 * - npm test — 61/61 passed (includes legacy frontend specs)
 * - npm run test:e2e:agendar — config OK; 7 skipped without E2E_ADMIN_* (run with server + creds)
 * - npm run smoke:agendar — requires npm run build && npm run start
 */
export const AUTOMATED_VERIFICATION = {
  unitAgendar: "36/36 passed",
  unitAll: "61/61 passed",
  e2e: "skipped without E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD",
  smoke: "run manually with frontend server on :3000",
} as const;
export const MANUAL_QA_CHECKLIST = {
  eventTab: [
    "Create booking with one service — appears in Mi Agenda",
    "Create booking with multiple serviceIds (booking_services migration applied)",
    "Edit existing booking via ?bookingId= only",
    "Create from Peticiones link — contact becomes RESERVED",
    "Closed availability date shows clear error",
    "Overlapping time slot shows API error",
    "Repeated POST throttling returns 429",
  ],
  classTab: [
    "Bookable class events list loads",
    "Session context and seat availability are correct",
    "Cash enrollment completes",
    "Stripe checkout works in staging",
  ],
  network: [
    "?mode=class — no occupied/availability polling",
    "?mode=event — single GET agenda/agendar/catalog",
  ],
  regression: [
    "Agenda hub and peticiones links still work",
    "npm run build (frontend) and backend tests pass",
  ],
} as const;

export type ManualQaSection = keyof typeof MANUAL_QA_CHECKLIST;
