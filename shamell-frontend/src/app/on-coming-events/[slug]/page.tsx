import { OnComingEventDetailPage } from "@/features/on-coming-events";

type Props = { params: Promise<{ slug: string }> };

export default async function OnComingEventDetailRoutePage({ params }: Props) {
  const { slug } = await params;
  return <OnComingEventDetailPage slug={slug} />;
}
