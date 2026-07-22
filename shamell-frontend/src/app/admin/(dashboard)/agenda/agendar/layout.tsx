import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book — Shamell Admin",
  description:
    "Create or edit a confirmed booking: event setup, date and time, location, and client details for Shamell Entertainment.",
};

export default function AgendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
