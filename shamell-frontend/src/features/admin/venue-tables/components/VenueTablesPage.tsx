"use client";

import dynamic from "next/dynamic";

const VenueTablesPageContent = dynamic(
  () => import("./VenueTablesPageContent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center p-8 text-shamell-text-primary">
        Loading…
      </div>
    ),
  },
);

export default function VenueTablesPage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <VenueTablesPageContent />
    </div>
  );
}
