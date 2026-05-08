"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: AdminSearchInputProps) {
  return (
    <label
      className={cn(
        "admin-search-pill mx-auto flex h-12 w-full max-w-4xl items-center gap-3 rounded-xl border border-gold/25 bg-transparent px-4 transition-[border-color,box-shadow] duration-150",
        "focus-within:border-gold/55 focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--shamell-state-focus)_48%,transparent)]",
        className,
      )}
    >
      <Search className="admin-text-muted h-4 w-4 shrink-0" aria-hidden />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        data-shamell-admin-search
        type="text"
        className="min-h-0 min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent p-0 text-sm text-foreground shadow-none outline-none ring-0 placeholder:text-foreground/45 focus:border-0 focus:ring-0 focus-visible:border-0 focus-visible:ring-0"
      />
    </label>
  );
}
