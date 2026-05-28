import { Suspense } from "react";
import { Inter } from "next/font/google";
import ShamellAdminShell from "@/components/admin/ShamellAdminShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-shamell-admin-sans",
});

export default function ShamellAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.variable}>
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
