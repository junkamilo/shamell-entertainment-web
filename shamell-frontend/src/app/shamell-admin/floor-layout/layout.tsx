import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venue layout — Shamell Admin",
  description: "Arrange tables, benches, and furniture on the venue floor plan.",
};

export default function FloorLayoutAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="-mx-5 -mb-5 flex min-h-[calc(100dvh-6rem)] min-w-0 flex-1 flex-col overflow-hidden max-lg:min-h-[calc(100dvh-7.5rem)] md:-mx-8 md:-mb-8 lg:min-h-[calc(100vh-3.75rem)]"
      style={{ ["--venue-chrome" as string]: "10rem" }}
    >
      {children}
    </div>
  );
}
