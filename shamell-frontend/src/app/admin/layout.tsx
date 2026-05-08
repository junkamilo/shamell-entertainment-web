import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-shamell-admin-sans",
});

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <div className={`admin-theme ${inter.variable}`}>{children}</div>;
}
