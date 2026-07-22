import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment history — Shamell Admin",
};

export default function PaymentHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
