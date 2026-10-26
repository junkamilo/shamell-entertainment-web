import { describe, expect, it } from "vitest";
import {
  adminNavEntries,
  filterAdminNavEntries,
  isAdminNavLinkActive,
} from "@/features/admin/shell/config/nav.config";
import { AGENDA_HUB_PATH } from "@/lib/admin/routes";
import {
  makeAdminNavLink,
  makeAdminSessionUser,
  makeUpcomingEventsNavGroup,
} from "@test/features/admin/shell/support/fixtures/shell.fixture";
import { FIXTURE_ADMIN_USER_ID } from "@test/features/admin/shell/support/fixtures/uuids.fixture";
import { createMockAdminSession } from "@test/features/admin/shell/support/helpers/mockShell";

describe("shell test environment", () => {
  it("exposes usable fixtures and session mock", () => {
    expect(makeAdminSessionUser().id).toBe(FIXTURE_ADMIN_USER_ID);
    expect(makeAdminNavLink().href).toBe(AGENDA_HUB_PATH);
    expect(makeUpcomingEventsNavGroup().children.length).toBeGreaterThan(0);

    const session = createMockAdminSession({ role: "ADMIN" });
    expect(session.role).toBe("ADMIN");
    expect(session.user?.fullName).toBe("Ada Lovelace");
  });

  it("uses real nav.config helpers with fixtures", () => {
    expect(isAdminNavLinkActive(AGENDA_HUB_PATH, AGENDA_HUB_PATH)).toBe(true);
    expect(adminNavEntries.length).toBeGreaterThan(0);
    expect(
      filterAdminNavEntries(adminNavEntries, ["admin.access"]).length,
    ).toBeGreaterThan(0);
  });
});
