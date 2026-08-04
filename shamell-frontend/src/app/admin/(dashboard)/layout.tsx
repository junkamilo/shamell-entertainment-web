import { Suspense } from "react";
import { ShamellAdminShell } from "@/features/admin/shell";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-foreground/55">
          Loading admin…
        </div>
      }
    >
      <ShamellAdminShell>{children}</ShamellAdminShell>
    </Suspense>
  );
}
