"use client";

import { useCallback, useState, type FormEvent } from "react";
import { forgotPasswordAction } from "../actions/forgotPasswordAction";

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
      setIsSubmitting(true);
      try {
        const result = await forgotPasswordAction(email);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setMessage(result.message);
        setResetLink(result.resetLink ?? null);
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
