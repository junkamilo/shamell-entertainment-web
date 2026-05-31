import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

function backendPayQuoteUrl(token: string): string {
  const backend = (
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001"
  ).replace(/\/$/, "");
  return `${backend}/api/v1/bookings/public/quote/pay?token=${encodeURIComponent(token)}`;
}

export default async function PayQuotePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const normalized = typeof token === "string" ? token.trim() : "";
  if (!normalized) {
    redirect("/");
  }

  redirect(backendPayQuoteUrl(normalized));
}
