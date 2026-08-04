import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "On Coming Events — Shamell Entertainment",
  description: "Browse upcoming events, book classes, or reserve your table.",
};

export default function OnComingEventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
