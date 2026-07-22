import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Table seating — Shamell Admin",
  description:
    "Configure venue tables with visual chair placement, bundle pricing, and extra chair rates.",
};

export default function VenueTablesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
