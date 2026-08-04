"use client";

import { AppStatusScreen } from "@/components/shared/AppStatusScreen";
import { publicErrorMessage } from "@/components/shared/publicErrorMessage";

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
