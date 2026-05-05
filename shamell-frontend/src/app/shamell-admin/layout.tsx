"use client";

import ShamellAdminShell from "@/components/admin/ShamellAdminShell";
import { ThemeProvider } from "@/features/theme/context/ThemeContext";

export default function ShamellAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShamellAdminShell>{children}</ShamellAdminShell>
    </ThemeProvider>
  );
}
