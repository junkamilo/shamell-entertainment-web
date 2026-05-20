import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-shamell-admin-sans",
});

export const metadata: Metadata = {
  title: "Forgot password — Shamell Entertainment",
  description: "Request a secure password recovery link for your Shamell account.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <div className={`admin-theme ${inter.variable}`}>{children}</div>;
}
