"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-white">
        <h1 className="text-2xl font-semibold text-amber-200">Something went wrong</h1>
        <p className="mt-3 max-w-md text-sm text-white/70">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-lg border border-amber-200/40 px-5 py-2.5 text-xs uppercase tracking-wider text-amber-200"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
