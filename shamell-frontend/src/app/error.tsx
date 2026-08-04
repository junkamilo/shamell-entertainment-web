"use client";

import { AppStatusScreen, publicErrorMessage } from "@/components/shared";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppStatusScreen
      title="Something went wrong"
      message={publicErrorMessage(error)}
      primaryAction={{ label: "Try again", onClick: reset }}
    />
  );
}
