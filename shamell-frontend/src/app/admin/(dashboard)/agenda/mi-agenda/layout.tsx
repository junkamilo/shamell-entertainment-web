import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My calendar — Shamell Admin",
};

export default function MiAgendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
