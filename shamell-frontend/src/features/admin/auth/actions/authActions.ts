"use server";

import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { postAdminLogin } from "../services/postAdminLogin";
import type { AdminLoginActionResult } from "../types/login.types";

export async function loginAdminAction(
  email: string,
  password: string,
): Promise<AdminLoginActionResult> {
  try {
    const { response, data } = await postAdminLogin(email, password);

    if (!response.ok) {
      const message = nestApiErrorMessage(data, "Invalid admin credentials.");
      return { ok: false, status: response.status, message };
    }

    const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const accessTokenRaw = record.accessToken;
    const accessToken = typeof accessTokenRaw === "string" ? accessTokenRaw : "";

    if (!accessToken.trim()) {
      return {
        ok: false,
        status: response.status,
        message: "Invalid admin credentials.",
      };
    }

    const userUnknown = record.user;
    let user: Record<string, unknown> | undefined;
    if (userUnknown && typeof userUnknown === "object" && userUnknown !== null) {
      user = userUnknown as Record<string, unknown>;
    }

    return {
      ok: true,
      status: response.status,
      accessToken: accessToken.trim(),
      ...(user !== undefined ? { user } : {}),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Cannot reach backend. Ensure API is running.",
    };
  }
}
