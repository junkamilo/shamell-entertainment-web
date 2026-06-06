import VenueSeatReturnClient from "@/app/on-coming-events/components/VenueSeatReturnClient";

type Props = { params: Promise<{ slug: string }> };

export default async function VenueSeatReturnPage({ params }: Props) {
  const { slug } = await params;
  return <VenueSeatReturnClient slug={slug} />;
}
