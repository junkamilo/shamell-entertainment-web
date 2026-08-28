"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { SHAMELL_ADMIN_PATH } from "@/lib/admin/routes";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  notifyAdminSessionChanged,
  persistAdminSessionUser,
} from "@/lib/admin/session";
import { postAdminLogin } from "../services/postAdminLogin";

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
        const { response, data } = await postAdminLogin(email, password);

        if (!response.ok) {
          setError(nestApiErrorMessage(data, "Invalid admin credentials."));
          return;
        }

        const record =
          data && typeof data === "object"
            ? (data as Record<string, unknown>)
            : {};
        const accessTokenRaw = record.accessToken;
        const accessToken =
          typeof accessTokenRaw === "string" ? accessTokenRaw.trim() : "";

        if (!accessToken) {
          setError("Invalid admin credentials.");
          return;
        }

        localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
        const userUnknown = record.user;
        if (userUnknown && typeof userUnknown === "object" && userUnknown !== null) {
          persistAdminSessionUser(userUnknown as Record<string, unknown>);
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
