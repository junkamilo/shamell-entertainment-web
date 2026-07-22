"use client";

import { AnimatePresence, motion } from "motion/react";
import { useAgregarAdminPage } from "../hooks/useAgregarAdminPage";
import AgregarAdminDetailsCard from "./AgregarAdminDetailsCard";
import AgregarAdminVerifyCard from "./AgregarAdminVerifyCard";

type PageState = ReturnType<typeof useAgregarAdminPage>;

type Props = {
  page: PageState;
};

export default function AgregarAdminMobilePhase({ page }: Props) {
  const { form, onSendCodeForm, onAddAdmin, sendVerificationCode } = page;

  return (
    <div className="p-5 md:p-8 lg:hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={form.phase === 1 ? "admin-details" : "code-password"}
          initial={{ opacity: 0, x: form.phase === 1 ? -18 : 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: form.phase === 1 ? 18 : -18 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          {form.phase === 1 ? (
            <AgregarAdminDetailsCard
              layout="mobile"
              phase={form.phase}
              email={form.email}
              fullName={form.fullName}
              isSending={form.isSending}
              onEmailChange={form.setEmail}
              onFullNameChange={form.setFullName}
              onSubmit={onSendCodeForm}
              onEditEmailOrName={form.goToPhase1}
            />
          ) : (
            <AgregarAdminVerifyCard
              layout="mobile"
              phase={form.phase}
              emailDisplay={form.emailDisplay}
              code={form.code}
              password={form.password}
              isSending={form.isSending}
              isVerifying={form.isVerifying}
              onCodeChange={form.setCode}
              onPasswordChange={form.setPassword}
              onSubmit={onAddAdmin}
              onResendCode={() => void sendVerificationCode(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
