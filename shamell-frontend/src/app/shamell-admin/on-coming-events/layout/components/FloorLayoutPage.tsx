"use client";

import dynamic from "next/dynamic";

const FloorLayoutPageContent = dynamic(
  () => import("./FloorLayoutPageContent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center p-8 text-shamell-text-primary">
        Loading editor…
      </div>
    ),
  },
);

export default function FloorLayoutPage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <FloorLayoutPageContent />
    </div>
  );
}
