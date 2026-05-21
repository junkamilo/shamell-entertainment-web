import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Header media — Shamell Admin",
};

export default function HeaderMediaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
