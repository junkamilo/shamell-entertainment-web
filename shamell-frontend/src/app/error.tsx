"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <h1 className="font-display text-2xl text-gold">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-foreground/70">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-gold/35 px-5 py-2.5 font-brand text-xs tracking-[0.14em] text-gold uppercase hover:bg-gold/10"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gold/20 px-5 py-2.5 font-brand text-xs tracking-[0.14em] text-foreground/75 uppercase hover:text-gold"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
