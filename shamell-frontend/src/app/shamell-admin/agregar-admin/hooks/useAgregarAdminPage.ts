"use client";

import { type FormEvent, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { getAgregarAdminBearerToken } from "../lib/agregarAdminAuth";
import { postAdminInvite } from "../services/postAdminInvite";
import { postAdminInviteVerify } from "../services/postAdminInviteVerify";
import { useAgregarAdminForm } from "./useAgregarAdminForm";

export function useAgregarAdminPage() {
  const form = useAgregarAdminForm();

  const sendVerificationCode = useCallback(
    async (isRetry = false) => {
      const token = getAgregarAdminBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an administrator.",
        });
        return;
      }

      const trimmedEmail = form.email.trim().toLowerCase();
      const trimmedName = form.fullName.trim();
      if (!trimmedEmail || !trimmedName) {
        toast({
          variant: "destructive",
          title: "Incomplete form",
          description: "Enter the new administrator's email and full name.",
        });
        return;
      }

      form.setIsSending(true);
      try {
        await postAdminInvite({ email: trimmedEmail, fullName: trimmedName });
        toast({
          title: isRetry ? "New invitation sent" : "Invitation sent",
          description: `Check ${trimmedEmail} for the Shamell admin invitation code.`,
        });
        form.setPhase(2);
        form.clearVerifyFields();
      } catch (err) {
        const description =
          err instanceof Error ? err.message : "Could not reach the server.";
        const isOffline = description === "Failed to fetch" || !(err instanceof Error);
        toast({
          variant: "destructive",
          title: isOffline ? "Offline" : "Could not send code",
          description: isOffline ? "Could not reach the server." : description,
        });
      } finally {
        form.setIsSending(false);
      }
    },
    [form],
  );

  const onSendCodeForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendVerificationCode(false);
  };

  const onAddAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = form.email.trim().toLowerCase();
    const trimmedCode = form.code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "The code must be exactly 6 digits.",
      });
      return;
    }
    if (form.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    form.setIsVerifying(true);
    try {
      await postAdminInviteVerify({
        email: trimmedEmail,
        code: trimmedCode,
        password: form.password,
      });
      toast({
        title: "Administrator created",
        description: `${trimmedEmail} can now sign in to the admin panel with that password.`,
      });
      form.resetFlow();
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Could not reach the server.";
      const isOffline = description === "Failed to fetch" || !(err instanceof Error);
      toast({
        variant: "destructive",
        title: isOffline ? "Offline" : "Could not create administrator",
        description: isOffline
          ? "Could not reach the server."
          : description || "Wrong or expired code, or email already registered.",
      });
    } finally {
      form.setIsVerifying(false);
    }
  };

  return {
    form,
    sendVerificationCode,
    onSendCodeForm,
    onAddAdmin,
  };
}
