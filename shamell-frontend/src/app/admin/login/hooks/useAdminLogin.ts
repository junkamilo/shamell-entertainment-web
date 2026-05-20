"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { SHAMELL_ADMIN_PATH } from "../../shared/lib/adminRoutes";
import { loginAdminAction } from "../actions/authActions";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_USER_KEY,
  notifyAdminSessionChanged,
} from "@/lib/adminSession";

export function useAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setMessage(null);
      setIsSubmitting(true);
      try {
        const result = await loginAdminAction(email, password);
        if (!result.ok) {
          setError(result.message);
          return;
        }

        localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, result.accessToken);
        if (result.user) {
          localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(result.user));
        }

        notifyAdminSessionChanged();
        setMessage("Admin login successful. Redirecting...");
        router.push(SHAMELL_ADMIN_PATH);
      } catch {
        setError("Cannot reach backend. Ensure API is running.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, router],
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    message,
    isSubmitting,
    onSubmit,
  };
}
