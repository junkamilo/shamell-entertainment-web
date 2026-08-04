import type { Metadata } from "next";
import { FixedTicketReturnClient } from "@/features/on-coming-events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function FixedTicketReturnPage({ params }: Props) {
  const { slug } = await params;
  return <FixedTicketReturnClient slug={slug} />;
}
