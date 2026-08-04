import type { Metadata } from "next";
import { VenueSeatReturnClient } from "@/features/on-coming-events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ event_slug?: string; slug?: string }>;
};

/** Canonical return URL for venue seat Stripe checkout. */
export default async function VenueLayoutReturnPage({ searchParams }: Props) {
  const params = await searchParams;
  const slug = params.event_slug?.trim() || params.slug?.trim() || "";
  return <VenueSeatReturnClient slug={slug} />;
}
