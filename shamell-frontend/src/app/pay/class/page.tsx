import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PayClassCheckoutClient } from "./components/PayClassCheckoutClient";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function PayClassPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const normalized = typeof token === "string" ? token.trim() : "";
  if (!normalized) {
    redirect("/");
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white px-4 py-16">
          <p className="font-brand text-xs tracking-[0.2em] text-foreground/60 uppercase">
            Loading secure payment…
          </p>
        </main>
      }
    >
      <PayClassCheckoutClient token={normalized} />
    </Suspense>
  );
}
