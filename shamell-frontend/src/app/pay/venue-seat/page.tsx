import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PayVenueSeatCheckoutClient } from "./components/PayVenueSeatCheckoutClient";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function PayVenueSeatPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const normalized = typeof token === "string" ? token.trim() : "";
  if (!normalized) {
    redirect("/");
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0a0908] px-4 py-16">
          <p className="font-brand text-xs tracking-[0.2em] text-foreground/60 uppercase">
            Loading secure payment…
          </p>
        </main>
      }
    >
      <PayVenueSeatCheckoutClient token={normalized} />
    </Suspense>
  );
}
