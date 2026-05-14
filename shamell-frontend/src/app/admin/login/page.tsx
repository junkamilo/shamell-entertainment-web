"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import bailarinaLogo from "@/public/01_bailarina.png";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_USER_KEY,
  notifyAdminSessionChanged,
} from "@/lib/adminSession";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.message ?? "Invalid admin credentials.");
        return;
      }

      if (data?.accessToken) {
        localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, data.accessToken);
      }
      if (data?.user) {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
      }

      notifyAdminSessionChanged();
      setMessage("Admin login successful. Redirecting...");
      router.push("/shamell-admin");
    } catch {
      setError("Cannot reach backend. Ensure API is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Shamell admin login
          </h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />

          {error ? <p className="text-sm text-shamell-danger">{error}</p> : null}
          {message ? <p className="text-gold-light text-sm">{message}</p> : null}

          <button type="submit" className="btn-outline-gold min-h-11 w-full font-brand" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In as Admin"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-brand text-gold text-xs tracking-[0.14em]">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-shamell-md border-shamell-line px-4 py-3 text-foreground outline-none focus:border-shamell-line-strong"
      />
    </label>
  );
}
