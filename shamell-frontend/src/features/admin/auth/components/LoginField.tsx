"use client";

import type { LoginFieldProps } from "../types/login.types";

export function LoginField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: LoginFieldProps) {
  return (
    <label className="block">
      <span className="font-brand text-[0.8125rem] tracking-[0.14em] text-gold sm:text-xs">{label}</span>
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
