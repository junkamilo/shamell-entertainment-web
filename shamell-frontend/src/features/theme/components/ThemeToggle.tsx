"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/features/theme/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className="admin-btn-secondary inline-flex h-9 w-9 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={1.65} /> : <Moon className="h-4 w-4" strokeWidth={1.65} />}
    </button>
  );
}
