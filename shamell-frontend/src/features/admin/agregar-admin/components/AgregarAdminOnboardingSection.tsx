"use client";

import { UserPlus } from "lucide-react";
import { useAgregarAdminPage } from "../hooks/useAgregarAdminPage";
import AgregarAdminDetailsCard from "./AgregarAdminDetailsCard";
import AgregarAdminMobilePhase from "./AgregarAdminMobilePhase";
import AgregarAdminVerifyCard from "./AgregarAdminVerifyCard";

type PageState = ReturnType<typeof useAgregarAdminPage>;

type Props = {
  page: PageState;
};

export default function AgregarAdminOnboardingSection({ page }: Props) {
  const { form, onSendCodeForm, onAddAdmin, sendVerificationCode } = page;

  return (
    <section
      id="add-admin-flow"
      className="shamell-glass-surface overflow-hidden rounded-2xl border border-gold/14"
    >
      <div className="border-b border-gold/12 bg-linear-to-r from-gold/10 via-transparent to-transparent px-5 py-4 md:px-8 md:py-5">
        <div className="flex flex-wrap items-center gap-2">
          <UserPlus className="h-5 w-5 text-gold/80" strokeWidth={1.4} />
          <h2 className="font-brand text-sm tracking-[0.16em] text-gold">Administrator onboarding</h2>
        </div>
      </div>

      <AgregarAdminMobilePhase page={page} />

      <div className="hidden gap-6 p-5 md:gap-8 md:p-8 lg:grid lg:grid-cols-2 lg:items-stretch">
        <AgregarAdminDetailsCard
          layout="desktop"
          phase={form.phase}
          email={form.email}
          fullName={form.fullName}
          isSending={form.isSending}
          onEmailChange={form.setEmail}
          onFullNameChange={form.setFullName}
          onSubmit={onSendCodeForm}
          onEditEmailOrName={form.goToPhase1}
        />
        <AgregarAdminVerifyCard
          layout="desktop"
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
      </div>
    </section>
  );
}
