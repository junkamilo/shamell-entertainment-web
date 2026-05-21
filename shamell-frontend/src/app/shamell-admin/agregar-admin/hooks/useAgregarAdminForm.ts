"use client";

import { useMemo, useState } from "react";
import type { AgregarAdminPhase } from "../types/agregarAdmin.types";

export function useAgregarAdminForm() {
  const [phase, setPhase] = useState<AgregarAdminPhase>(1);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const emailDisplay = useMemo(() => email.trim().toLowerCase(), [email]);

  const resetFlow = () => {
    setPhase(1);
    setEmail("");
    setFullName("");
    setCode("");
    setPassword("");
  };

  const goToPhase1 = () => {
    setPhase(1);
    setCode("");
    setPassword("");
  };

  const clearVerifyFields = () => {
    setCode("");
    setPassword("");
  };

  return {
    phase,
    setPhase,
    email,
    setEmail,
    fullName,
    setFullName,
    code,
    setCode,
    password,
    setPassword,
    isSending,
    setIsSending,
    isVerifying,
    setIsVerifying,
    emailDisplay,
    resetFlow,
    goToPhase1,
    clearVerifyFields,
  };
}
