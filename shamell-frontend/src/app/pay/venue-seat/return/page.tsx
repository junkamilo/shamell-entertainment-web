import type { Metadata } from "next";
import { VenueSeatReturnClient } from "@/features/on-coming-events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PayVenueSeatReturnPage() {
  return <VenueSeatReturnClient slug="" />;
}
