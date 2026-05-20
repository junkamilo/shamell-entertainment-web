import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password — Shamell Entertainment",
  description: "Set a new password using your secure recovery link.",
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
