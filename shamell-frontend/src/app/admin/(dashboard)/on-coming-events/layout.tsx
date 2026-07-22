import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "On Coming Events (site) — Shamell Admin",
  description:
    "Publish On Coming Events on the public site and manage the home promo block.",
};

export default function VenueLayoutPromoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
