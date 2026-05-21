import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Shamell — Shamell Admin",
  description:
    "Manage the About Shamell block on the public home page: title, body text, core values, and hero image or video.",
};

export default function AboutAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
