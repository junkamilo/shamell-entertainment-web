"use client";

import { Suspense } from "react";
import { AgendarPageContent } from "./AgendarPageContent";

export function AgendarPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <AgendarPageContent />
    </Suspense>
  );
}
