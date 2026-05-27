import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venue layout (site) — Shamell Admin",
  description:
    "Publish the interactive venue floor plan on the public site and manage the home promo block.",
};

export default function VenueLayoutPromoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
