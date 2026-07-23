"use client";

import Image from "next/image";
import Link from "next/link";
import bailarinaLogo from "@/public/01_bailarina.png";
import { FORGOT_PASSWORD_PATH } from "@/features/forgot-password";
import { useAdminLogin } from "../hooks/useAdminLogin";
import { LoginField } from "./LoginField";

export function AdminLoginForm() {
  const { email, setEmail, password, setPassword, error, message, isSubmitting, onSubmit } =
    useAdminLogin();

  return (
    <>
      <div className="mb-7 flex flex-col items-center text-center sm:mb-8">
        <Image
          src={bailarinaLogo}
          alt="Shamell bailarina logo"
          className="mb-4 h-14 w-auto sm:h-16"
          priority
        />
        <h1 className="mb-2 font-brand text-[1.75rem] leading-tight tracking-[0.1em] text-gold sm:text-3xl md:text-4xl md:tracking-[0.14em]">
          Shamell admin login
        </h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
        <LoginField label="Email" type="email" value={email} onChange={setEmail} required />
        <LoginField label="Password" type="password" value={password} onChange={setPassword} required />

        {error ? (
          <p className="font-elegant text-xl leading-[1.65] text-shamell-danger sm:font-body sm:text-sm">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="font-elegant text-xl leading-[1.65] text-gold-light sm:font-body sm:text-sm">
            {message}
          </p>
        ) : null}

        <button type="submit" className="btn-outline-gold min-h-11 w-full font-brand" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In as Admin"}
        </button>
      </form>

      <p className="mt-6 text-center font-elegant text-xl leading-[1.65] sm:font-body sm:text-sm">
        <Link
          href={FORGOT_PASSWORD_PATH}
          className="text-gold/90 underline-offset-4 hover:text-gold hover:underline"
        >
          Forgot password?
        </Link>
      </p>
    </>
  );
}
