"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import FlameIcon from "@/components/FlameIcon";
import PearlDivider from "@/components/PearlDivider";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_USER_KEY,
  notifyAdminSessionChanged,
} from "@/lib/adminSession";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);
  const [code, setCode] = useState("");
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

    if (enable2FA && code.trim().length < 6) {
      setError("Enter a valid 2FA code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          twoFactorCode: enable2FA ? code : undefined,
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
      router.push("/");
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
            ADMIN LOGIN
          </h1>
          <p className="font-script text-gold-light text-2xl">Restricted access</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />

          <label className="flex items-center gap-3 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={enable2FA}
              onChange={(event) => setEnable2FA(event.target.checked)}
              className="h-4 w-4 accent-(--color-gold)"
            />
            Enable two-factor authentication (2FA)
          </label>

          {enable2FA ? (
            <Field
              label="2FA Code"
              value={code}
              onChange={setCode}
              placeholder="6-digit code"
              required
            />
          ) : null}

          {error ? <p className="text-red-300 text-sm">{error}</p> : null}
          {message ? <p className="text-gold-light text-sm">{message}</p> : null}

          <button type="submit" className="btn-outline-gold w-full font-brand" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In as Admin"}
          </button>
        </form>

        <PearlDivider className="mt-10" />
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
        className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none focus:border-gold"
      />
    </label>
  );
}
