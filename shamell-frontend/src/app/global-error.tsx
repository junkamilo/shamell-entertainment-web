"use client";

import { AppStatusScreen } from "@/components/shared/AppStatusScreen";
import { publicErrorMessage } from "@/components/shared/publicErrorMessage";
import {
  cinzel,
  cormorant,
  geistMono,
  geistSans,
  greatVibes,
} from "@/lib/theme/shamellFonts";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${greatVibes.variable} ${cormorant.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <AppStatusScreen
          title="Something went wrong"
          message={publicErrorMessage(error)}
          primaryAction={{ label: "Try again", onClick: reset }}
        />
      </body>
    </html>
  );
}
