import { shamellAdminSans } from "@/lib/shamellFonts";

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <div className={`admin-theme ${shamellAdminSans.variable}`}>{children}</div>;
}
