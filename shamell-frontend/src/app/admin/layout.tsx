import { shamellAdminSans } from "@/lib/theme/shamellFonts";

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <div className={`admin-theme ${shamellAdminSans.variable}`}>{children}</div>;
}
