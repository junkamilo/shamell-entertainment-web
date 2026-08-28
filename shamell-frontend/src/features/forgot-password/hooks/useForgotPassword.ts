"use client";

import { useCallback, useState, type FormEvent } from "react";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { requestPasswordReset } from "../services/requestPasswordReset";

const SUCCESS_FALLBACK =
  "If this email exists, a secure recovery link has been sent.";

export function useForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setMessage(null);
      setResetLink(null);

      const trimmed = email.trim();
      if (!trimmed) {
        setError("Please enter your email address.");
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await requestPasswordReset(trimmed);
        const data: unknown = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(
            nestApiErrorMessage(
              data,
              "Could not process your request. Please try again.",
            ),
          );
          return;
        }

        const record =
          data && typeof data === "object"
            ? (data as Record<string, unknown>)
            : {};
        const nextMessage =
          typeof record.message === "string" && record.message.trim()
            ? record.message.trim()
            : SUCCESS_FALLBACK;
        const resetLinkRaw = record.resetLink;
        setMessage(nextMessage);
        setResetLink(
          typeof resetLinkRaw === "string" && resetLinkRaw.trim()
            ? resetLinkRaw.trim()
            : null,
        );
        setEmail("");
      } catch {
        setError("Cannot reach backend. Ensure API is running.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email],
  );

  return { email, setEmail, error, message, resetLink, isSubmitting, onSubmit };
}
