"use client";

import Image from "next/image";
import Link from "next/link";
import bailarinaLogo from "@/public/01_bailarina.png";
import { ADMIN_LOGIN_PATH } from "@/app/admin/shared/lib/adminRoutes";
import { useResetPassword } from "../hooks/useResetPassword";
import PasswordField from "./PasswordField";

export default function ResetPasswordForm() {
  const {
    tokenError,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    message,
    isSubmitting,
    onSubmit,
  } = useResetPassword();

  const displayError = tokenError ?? error;

  return (
    <main className="shamell-admin-bg flex min-h-svh items-center justify-center px-4 py-8 sm:py-12">
      <section className="admin-panel w-full max-w-md border-shamell-line-strong p-7 sm:p-8 md:max-w-xl md:p-10">
        <div className="mb-7 flex flex-col items-center text-center sm:mb-8">
          <Image
            src={bailarinaLogo}
            alt="Shamell bailarina logo"
            className="mb-4 h-14 w-auto sm:h-16"
            priority
          />
          <h1 className="mb-2 font-brand text-2xl tracking-[0.12em] text-gold sm:text-3xl md:text-4xl md:tracking-[0.14em]">
            Choose a new password
          </h1>
        </div>

        {message ? (
          <div className="space-y-6 text-center">
            <p className="text-gold-light text-sm">{message}</p>
            <Link href={ADMIN_LOGIN_PATH} className="btn-outline-gold inline-flex min-h-11 items-center justify-center px-6 font-brand">
              Sign in as admin
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              required
            />
            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              required
            />

            {displayError ? <p className="text-sm text-shamell-danger">{displayError}</p> : null}

            <button
              type="submit"
              className="btn-outline-gold min-h-11 w-full font-brand"
              disabled={isSubmitting || Boolean(tokenError)}
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link
            href={ADMIN_LOGIN_PATH}
            className="text-gold/90 underline-offset-4 hover:text-gold hover:underline"
          >
            Back to admin sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
