import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PayQuoteReturnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
