import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Box office — Shamell Admin",
};

export default function BoxOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
