import VenueSeatReturnClient from "@/app/on-coming-events/components/VenueSeatReturnClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function VenueSeatReturnPage({ params }: Props) {
  const { slug } = await params;
  return <VenueSeatReturnClient slug={slug} />;
}
