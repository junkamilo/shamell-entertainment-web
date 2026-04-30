"use client";

import ShamellAdminShell from "@/components/admin/ShamellAdminShell";

export default function ShamellAdminLayout({ children }: { children: React.ReactNode }) {
  return <ShamellAdminShell>{children}</ShamellAdminShell>;
}
