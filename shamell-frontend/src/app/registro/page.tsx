"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import FlameIcon from "@/components/FlameIcon";
import PearlDivider from "@/components/PearlDivider";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegistroPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    if (form.password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.message ?? "No se pudo completar el registro.");
        return;
      }

      setMessage("Registro completado. El usuario fue creado como CLIENT.");
      setForm(initialState);
    } catch {
      setError("No hay conexion con el backend. Verifica que este ejecutandose.");
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
            REGISTRO
          </h1>
          <p className="font-script text-gold-light text-2xl">
            Create your Shamell account
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="Nombre completo"
            value={form.fullName}
            onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
            required
          />
          <Field
            label="Telefono (opcional)"
            value={form.phone}
            onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
          />
          <Field
            label="Contrasena"
            type="password"
            value={form.password}
            onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
            required
          />
          <Field
            label="Confirmar contrasena"
            type="password"
            value={form.confirmPassword}
            onChange={(value) => setForm((prev) => ({ ...prev, confirmPassword: value }))}
            required
          />

          {error ? <p className="text-red-300 text-sm">{error}</p> : null}
          {message ? <p className="text-gold-light text-sm">{message}</p> : null}

          <button type="submit" className="btn-outline-gold w-full font-brand" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 text-xs tracking-wide">
          <Link href="/login" className="text-gold hover:text-gold-light transition-colors">
            Already have an account? Login
          </Link>
        </div>

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
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-brand text-gold text-xs tracking-[0.14em]">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none focus:border-gold"
      />
    </label>
  );
}
