"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import FlameIcon from "@/components/FlameIcon";
import PearlDivider from "@/components/PearlDivider";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError("Password recovery flow is not configured yet.");
        return;
      }

      setMessage("If this email exists, a secure recovery link has been sent.");
    } catch {
      setError("Cannot reach backend. Ensure API is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-background min-h-screen pt-20 pb-16 px-4">
      <section className="max-w-2xl mx-auto border border-gold/30 bg-background/80 p-8 md:p-10">
        <div className="flex flex-col items-center text-center mb-8">
          <FlameIcon className="w-10 h-14 mb-4" />
          <h1 className="font-brand text-gold text-2xl md:text-4xl tracking-[0.16em] mb-2">
            FORGOT PASSWORD
          </h1>
          <p className="font-script text-gold-light text-2xl">Secure password recovery</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="font-brand text-gold text-xs tracking-[0.14em]">Account email</span>
            <input
              type="email"
              value={email}
              required
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none focus:border-gold"
            />
          </label>

          {error ? <p className="text-red-300 text-sm">{error}</p> : null}
          {message ? <p className="text-gold-light text-sm">{message}</p> : null}

          <button type="submit" className="btn-outline-gold w-full font-brand" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send recovery link"}
          </button>
        </form>

        <div className="mt-6 text-xs tracking-wide">
          <Link href="/login" className="text-gold hover:text-gold-light transition-colors">
            Back to login
          </Link>
        </div>

        <PearlDivider className="mt-10" />
      </section>
    </main>
  );
}
