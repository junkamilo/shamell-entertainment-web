import FixedTicketReturnClient from "./FixedTicketReturnClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function FixedTicketReturnPage({ params }: Props) {
  const { slug } = await params;
  return <FixedTicketReturnClient slug={slug} />;
}
