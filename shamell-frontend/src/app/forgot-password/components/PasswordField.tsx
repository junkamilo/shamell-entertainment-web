"use client";

import type { PasswordFieldProps } from "../types/forgotPassword.types";

export default function PasswordField({
  label,
  value,
  onChange,
  type = "password",
  placeholder,
  required = false,
  autoComplete,
}: PasswordFieldProps) {
  return (
    <label className="block">
      <span className="font-brand text-gold text-xs tracking-[0.14em]">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-shamell-md border-shamell-line px-4 py-3 text-foreground outline-none focus:border-shamell-line-strong"
      />
    </label>
  );
}
