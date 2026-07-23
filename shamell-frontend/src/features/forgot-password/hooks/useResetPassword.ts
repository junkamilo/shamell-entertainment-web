"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { resetPasswordAction } from "../actions/resetPasswordAction";

const MISSING_TOKEN_ERROR = "Invalid or missing recovery link.";

export function useResetPassword() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tokenError = !token ? MISSING_TOKEN_ERROR : null;

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setMessage(null);

      if (!token) {
        setError(MISSING_TOKEN_ERROR);
        return;
      }
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await resetPasswordAction(token, newPassword);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setMessage(result.message);
        setNewPassword("");
        setConfirmPassword("");
      } catch {
        setError("Cannot reach backend. Ensure API is running.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [confirmPassword, newPassword, token],
  );

  return {
    token,
    tokenError,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    message,
    isSubmitting,
    onSubmit,
  };
}
