import type { Metadata } from "next";
import { shamellAdminSans } from "@/lib/shamellFonts";

export const metadata: Metadata = {
  title: "Forgot password — Shamell Entertainment",
  description: "Request a secure password recovery link for your Shamell account.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <div className={`admin-theme ${shamellAdminSans.variable}`}>{children}</div>;
}
