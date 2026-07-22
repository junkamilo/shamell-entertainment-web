import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seat reservations | Shamell Admin",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
