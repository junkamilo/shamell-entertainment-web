import { describe, expect, it } from "vitest";
import * as libRoutes from "@/lib/admin/routes";
import {
  ABOUT_ADMIN_PATH,
  ADMIN_DASHBOARD_PATH,
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  AGENDA_BOX_OFFICE_PATH,
  AGENDA_DISPONIBILIDAD_PATH,
  AGENDA_HUB_PATH,
  AGENDA_MI_AGENDA_PATH,
  AGENDA_PAYMENT_HISTORY_PATH,
  AGENDA_PETICIONES_PATH,
  AGENDA_STRIPE_WEBHOOKS_PATH,
  AGENDAR_PATH,
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
} from "./adminRoutes";

describe("adminRoutes (app shared re-export)", () => {
  it("re-exports the same path constants as @/lib/admin/routes", () => {
    expect(ADMIN_LOGIN_PATH).toBe(libRoutes.ADMIN_LOGIN_PATH);
    expect(ADMIN_DASHBOARD_PATH).toBe(libRoutes.ADMIN_DASHBOARD_PATH);
    expect(SHAMELL_ADMIN_PATH).toBe(libRoutes.SHAMELL_ADMIN_PATH);
    expect(ADMIN_HOME_PATH).toBe(libRoutes.ADMIN_HOME_PATH);
    expect(SERVICES_PATH).toBe(libRoutes.SERVICES_PATH);
    expect(SERVICE_TYPES_PATH).toBe(libRoutes.SERVICE_TYPES_PATH);
    expect(OCCASION_TYPES_PATH).toBe(libRoutes.OCCASION_TYPES_PATH);
    expect(EVENT_TYPES_PATH).toBe(libRoutes.EVENT_TYPES_PATH);
    expect(EVENTS_PATH).toBe(libRoutes.EVENTS_PATH);
    expect(UPCOMING_EVENTS_ADMIN_PATH).toBe(libRoutes.UPCOMING_EVENTS_ADMIN_PATH);
    expect(GALLERY_PATH).toBe(libRoutes.GALLERY_PATH);
    expect(GALLERY_CATEGORIES_PATH).toBe(libRoutes.GALLERY_CATEGORIES_PATH);
    expect(HEADER_MEDIA_PATH).toBe(libRoutes.HEADER_MEDIA_PATH);
    expect(ABOUT_ADMIN_PATH).toBe(libRoutes.ABOUT_ADMIN_PATH);
    expect(AGREGAR_ADMIN_PATH).toBe(libRoutes.AGREGAR_ADMIN_PATH);
    expect(AGENDA_HUB_PATH).toBe(libRoutes.AGENDA_HUB_PATH);
    expect(AGENDAR_PATH).toBe(libRoutes.AGENDAR_PATH);
    expect(AGENDA_DISPONIBILIDAD_PATH).toBe(libRoutes.AGENDA_DISPONIBILIDAD_PATH);
    expect(AGENDA_MI_AGENDA_PATH).toBe(libRoutes.AGENDA_MI_AGENDA_PATH);
    expect(AGENDA_PETICIONES_PATH).toBe(libRoutes.AGENDA_PETICIONES_PATH);
    expect(AGENDA_PAYMENT_HISTORY_PATH).toBe(
      libRoutes.AGENDA_PAYMENT_HISTORY_PATH,
    );
    expect(AGENDA_BOX_OFFICE_PATH).toBe(libRoutes.AGENDA_BOX_OFFICE_PATH);
    expect(AGENDA_STRIPE_WEBHOOKS_PATH).toBe(
      libRoutes.AGENDA_STRIPE_WEBHOOKS_PATH,
    );
    expect(VENUE_TABLES_PATH).toBe(libRoutes.VENUE_TABLES_PATH);
    expect(VENUE_RESERVATIONS_ADMIN_PATH).toBe(
      libRoutes.VENUE_RESERVATIONS_ADMIN_PATH,
    );
    expect(ON_COMING_EVENTS_ADMIN_PATH).toBe(
      libRoutes.ON_COMING_EVENTS_ADMIN_PATH,
    );
    expect(ON_COMING_EVENTS_LAYOUT_ADMIN_PATH).toBe(
      libRoutes.ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
    );
  });

  it("exposes the canonical admin login and dashboard paths", () => {
    expect(ADMIN_LOGIN_PATH).toBe("/admin/login");
    expect(ADMIN_DASHBOARD_PATH).toBe("/admin/dashboard");
    expect(SHAMELL_ADMIN_PATH).toBe("/admin");
  });
});
