"use server";

import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { requestPasswordReset } from "../services/requestPasswordReset";
import type { ForgotPasswordActionResult } from "../types/forgotPassword.types";

const SUCCESS_FALLBACK = "If this email exists, a secure recovery link has been sent.";

export async function forgotPasswordAction(email: string): Promise<ForgotPasswordActionResult> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, message: "Please enter your email address." };
  }

  try {
    const response = await requestPasswordReset(trimmed);
    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        message: nestApiErrorMessage(data, "Could not process your request. Please try again."),
      };
    }

    const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const message =
      typeof record.message === "string" && record.message.trim() ? record.message.trim() : SUCCESS_FALLBACK;

    return { ok: true, message };
  } catch {
    return { ok: false, message: "Cannot reach backend. Ensure API is running." };
  }
}
