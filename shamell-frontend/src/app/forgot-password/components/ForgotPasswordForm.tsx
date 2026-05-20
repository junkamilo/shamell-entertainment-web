"use client";

import Image from "next/image";
import Link from "next/link";
import bailarinaLogo from "@/public/01_bailarina.png";
import { useForgotPassword } from "../hooks/useForgotPassword";
import PasswordField from "./PasswordField";

export default function ForgotPasswordForm() {
  const { email, setEmail, error, message, isSubmitting, onSubmit } = useForgotPassword();

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
            Reset your password
          </h1>
          <p className="mt-2 font-body text-sm text-foreground/75">
            Enter your email and we will send a secure recovery link if an account exists.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
          <PasswordField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />

          {error ? <p className="text-sm text-shamell-danger">{error}</p> : null}
          {message ? <p className="text-gold-light text-sm">{message}</p> : null}

          <button type="submit" className="btn-outline-gold min-h-11 w-full font-brand" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send recovery link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-gold/90 underline-offset-4 hover:text-gold hover:underline">
            Back to home
          </Link>
          <span className="mx-2 text-foreground/40">·</span>
          <Link
            href="/admin/login"
            className="text-gold/90 underline-offset-4 hover:text-gold hover:underline"
          >
            Admin sign in
          </Link>
        </p>
      </section>
    </main>
  );
}