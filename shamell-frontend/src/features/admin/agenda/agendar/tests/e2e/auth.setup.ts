import fs from "node:fs";
import path from "node:path";
import { test as setup, expect } from "@playwright/test";
import { ADMIN_ACCESS_TOKEN_KEY, ADMIN_USER_KEY } from "./e2eConstants";

const authDir = path.join(__dirname, ".auth");
const authFile = path.join(authDir, "admin.json");

setup("authenticate admin", async ({ page, baseURL }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  fs.mkdirSync(authDir, { recursive: true });

  if (!email || !password) {
    fs.writeFileSync(
      authFile,
      JSON.stringify({ cookies: [], origins: [] }, null, 2),
      "utf-8",
    );
    setup.skip(true, "E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required");
    return;
  }

  const backend = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(
    /\/$/,
    "",
  );

  const response = await fetch(`${backend}/api/v1/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    accessToken?: string;
    user?: { role?: string; email?: string };
  };

  expect(response.ok, `Admin login failed (${response.status})`).toBeTruthy();
  expect(data.accessToken, "Missing accessToken from admin login").toBeTruthy();

  await page.goto(baseURL ?? "http://localhost:3000");
  await page.evaluate(
    ({ tokenKey, userKey, token, user }) => {
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userKey, JSON.stringify(user));
    },
    {
      tokenKey: ADMIN_ACCESS_TOKEN_KEY,
      userKey: ADMIN_USER_KEY,
      token: data.accessToken!,
      user: data.user ?? { role: "ADMIN", email },
    },
  );

  await page.context().storageState({ path: authFile });
});
