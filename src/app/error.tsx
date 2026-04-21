'use client';

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-4">
      <h1 className="font-brand text-gold text-4xl tracking-widest mb-4">
        Something went wrong
      </h1>
      <p className="font-elegant italic text-foreground/60 text-lg mb-8">
        An unexpected error occurred.
      </p>
      <div className="flex gap-4">
        <button onClick={reset} className="btn-outline-gold font-brand text-xs">
          Try Again
        </button>
        <Link href="/" className="btn-outline-gold font-brand text-xs">
          Return Home
        </Link>
      </div>
    </div>
  );
}
