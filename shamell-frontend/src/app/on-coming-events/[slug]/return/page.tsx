import FixedTicketReturnClient from "./FixedTicketReturnClient";

type Props = { params: Promise<{ slug: string }> };

export default async function FixedTicketReturnPage({ params }: Props) {
  const { slug } = await params;
  return <FixedTicketReturnClient slug={slug} />;
}
