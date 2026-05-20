"use server";

import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { submitPasswordReset } from "../services/submitPasswordReset";
import type { ResetPasswordActionResult } from "../types/forgotPassword.types";

export async function resetPasswordAction(
  token: string,
  newPassword: string,
): Promise<ResetPasswordActionResult> {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return { ok: false, message: "Invalid or missing recovery link." };
  }
  if (newPassword.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  try {
    const response = await submitPasswordReset(trimmedToken, newPassword);
    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        message: nestApiErrorMessage(data, "Invalid or expired recovery token."),
      };
    }

    const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const message =
      typeof record.message === "string" && record.message.trim()
        ? record.message.trim()
        : "Password updated successfully.";

    return { ok: true, message };
  } catch {
    return { ok: false, message: "Cannot reach backend. Ensure API is running." };
  }
}
