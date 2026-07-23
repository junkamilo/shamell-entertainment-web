import VenueSeatReturnClient from "@/features/on-coming-events/components/VenueSeatReturnClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ event_slug?: string; slug?: string }>;
};

/** Legacy + fallback return URL for venue seat Stripe checkout. */
export default async function VenueLayoutReturnPage({ searchParams }: Props) {
  const params = await searchParams;
  const slug = params.event_slug?.trim() || params.slug?.trim() || "";
  return <VenueSeatReturnClient slug={slug} />;
}
