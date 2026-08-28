import { test, expect } from "@playwright/test";
import { AGENDA_DISPONIBILIDAD_PATH } from "../../constants";

const CLOSURE_ID = "550e8400-e29b-41d4-a716-446655440031";

test.describe("Availability", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("switches weekly/closures and create/delete closure mocks", async ({
    page,
  }) => {
    const closures: Array<Record<string, unknown>> = [
      {
        id: CLOSURE_ID,
        kind: "SPECIFIC_DATE",
        date: "2030-12-25",
        weekday: null,
        startDate: null,
        endDate: null,
        note: "Holiday",
        createdAt: "2030-01-10T12:00:00.000Z",
      },
    ];

    await page.route("**/api/v1/availability/admin**", async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            timeZone: "America/New_York",
            weekly: [
              {
                id: "550e8400-e29b-41d4-a716-446655440040",
                weekday: 1,
                startTime: "10:00",
                endTime: "18:00",
                updatedAt: "2030-01-15T12:00:00.000Z",
              },
            ],
            closures,
          }),
        });
        return;
      }

      if (method === "POST" && url.includes("/closures")) {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        const created = {
          id: "550e8400-e29b-41d4-a716-446655440032",
          kind: body.kind ?? "SPECIFIC_DATE",
          date: body.date ?? "2030-12-26",
          weekday: null,
          startDate: null,
          endDate: null,
          note: body.note ?? null,
          createdAt: new Date().toISOString(),
        };
        closures.push(created);
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(created),
        });
        return;
      }

      if (method === "DELETE" && url.includes("/closures/")) {
        const id = url.split("/closures/")[1]?.split("?")[0];
        const idx = closures.findIndex((c) => c.id === id);
        if (idx >= 0) closures.splice(idx, 1);
        await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
        return;
      }

      if (method === "PUT" && url.includes("/weekly")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
        return;
      }

      await route.fallback();
    });

    await page.goto(AGENDA_DISPONIBILIDAD_PATH);
    await expect(
      page.getByRole("heading", { name: "Availability" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "WEEKLY HOURS" })).toBeVisible();

    await page.getByRole("button", { name: "CLOSURES" }).click();
    await expect(page.getByText("Holiday")).toBeVisible({ timeout: 10_000 });

    const deleteBtn = page.getByRole("button", { name: /Delete|Remove/i }).first();
    if (await deleteBtn.count()) {
      await deleteBtn.click();
      const confirm = page.getByRole("button", { name: /Delete|Confirm|Yes/i });
      if (await confirm.count()) {
        await confirm.last().click();
      }
    }
  });
});
