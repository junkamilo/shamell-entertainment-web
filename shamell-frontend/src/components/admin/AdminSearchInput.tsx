"use client";

import { Search } from "lucide-react";

type AdminSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function AdminSearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
}: AdminSearchInputProps) {
  return (
    <label
      className={`mx-auto flex h-12 w-full max-w-4xl items-center gap-3 rounded-xl border border-gold/20 bg-black/20 px-4 ${className}`}
    >
      <Search className="h-4 w-4 text-foreground/55" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/45"
      />
    </label>
  );
}
