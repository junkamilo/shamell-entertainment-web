import { describe, it, expect } from "vitest";
import {
  ABOUT_ADMIN_PATH,
  ADMIN_DASHBOARD_PATH,
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  AGENDA_HUB_PATH,
  AGENDAR_PATH,
  AGENDA_BOX_OFFICE_PATH,
  AGENDA_DISPONIBILIDAD_PATH,
  AGENDA_MI_AGENDA_PATH,
  AGENDA_PAYMENT_HISTORY_PATH,
  AGENDA_PETICIONES_PATH,
  AGENDA_STRIPE_WEBHOOKS_PATH,
  AGREGAR_ADMIN_PATH,
  EVENT_TYPES_PATH,
  EVENTS_PATH,
  GALLERY_CATEGORIES_PATH,
  GALLERY_PATH,
  HEADER_MEDIA_PATH,
  OCCASION_TYPES_PATH,
  ON_COMING_EVENTS_ADMIN_PATH,
  ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
  SERVICE_TYPES_PATH,
  SERVICES_PATH,
  SHAMELL_ADMIN_PATH,
  UPCOMING_EVENTS_ADMIN_PATH,
  VENUE_RESERVATIONS_ADMIN_PATH,
  VENUE_TABLES_PATH,
} from "./routes";

describe("admin routes", () => {
  it("exposes canonical login and home paths under /admin", () => {
    expect(ADMIN_LOGIN_PATH).toBe("/admin/login");
    expect(ADMIN_DASHBOARD_PATH).toBe("/admin/dashboard");
    expect(SHAMELL_ADMIN_PATH).toBe("/admin");
    expect(ADMIN_HOME_PATH).toBe("/admin");
  });

  it("exposes catalog paths", () => {
    expect(SERVICES_PATH).toBe("/admin/services");
    expect(SERVICE_TYPES_PATH).toBe("/admin/service-types");
    expect(OCCASION_TYPES_PATH).toBe("/admin/occasion-types");
    expect(EVENT_TYPES_PATH).toBe("/admin/event-types");
    expect(EVENTS_PATH).toBe("/admin/events");
    expect(UPCOMING_EVENTS_ADMIN_PATH).toBe("/admin/upcoming-events");
    expect(GALLERY_PATH).toBe("/admin/gallery");
    expect(GALLERY_CATEGORIES_PATH).toBe("/admin/gallery-categories");
    expect(HEADER_MEDIA_PATH).toBe("/admin/header-media");
    expect(ABOUT_ADMIN_PATH).toBe("/admin/about");
    expect(AGREGAR_ADMIN_PATH).toBe("/admin/agregar-admin");
  });

  it("exposes agenda paths", () => {
    expect(AGENDA_HUB_PATH).toBe("/admin/agenda");
    expect(AGENDAR_PATH).toBe("/admin/agenda/agendar");
    expect(AGENDA_DISPONIBILIDAD_PATH).toBe("/admin/agenda/disponibilidad");
    expect(AGENDA_MI_AGENDA_PATH).toBe("/admin/agenda/mi-agenda");
    expect(AGENDA_PETICIONES_PATH).toBe("/admin/agenda/peticiones");
    expect(AGENDA_PAYMENT_HISTORY_PATH).toBe("/admin/agenda/payment-history");
    expect(AGENDA_BOX_OFFICE_PATH).toBe("/admin/agenda/box-office");
    expect(AGENDA_STRIPE_WEBHOOKS_PATH).toBe("/admin/agenda/stripe-webhooks");
  });

  it("exposes venue / on-coming paths", () => {
    expect(VENUE_TABLES_PATH).toBe("/admin/venue-tables");
    expect(VENUE_RESERVATIONS_ADMIN_PATH).toBe("/admin/venue-reservations");
    expect(ON_COMING_EVENTS_ADMIN_PATH).toBe("/admin/on-coming-events");
    expect(ON_COMING_EVENTS_LAYOUT_ADMIN_PATH).toBe(
      "/admin/on-coming-events/layout",
    );
  });
});
