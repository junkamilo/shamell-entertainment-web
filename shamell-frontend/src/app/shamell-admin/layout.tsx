import { Inter } from "next/font/google";
import ShamellAdminShell from "@/components/admin/ShamellAdminShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-shamell-admin-sans",
});

export default function ShamellAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.variable}>
      <ShamellAdminShell>{children}</ShamellAdminShell>
    </div>
  );
}
