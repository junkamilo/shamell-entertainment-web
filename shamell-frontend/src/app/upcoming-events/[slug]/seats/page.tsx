import { VenueLayoutPublicPage } from "@/features/on-coming-events";

type Props = { params: Promise<{ slug: string }> };

export default async function UpcomingSeatsRoutePage({ params }: Props) {
  const { slug } = await params;
  return <VenueLayoutPublicPage eventSlug={slug} />;
}
