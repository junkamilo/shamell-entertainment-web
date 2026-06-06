import { Suspense } from "react";
import ShamellAdminShell from "@/components/admin/ShamellAdminShell";
import { shamellAdminSans } from "@/lib/shamellFonts";

export default function ShamellAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={shamellAdminSans.variable}>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center text-sm text-foreground/55">
            Loading admin…
          </div>
        }
      >
        <ShamellAdminShell>{children}</ShamellAdminShell>
      </Suspense>
    </div>
  );
}
