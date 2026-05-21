import type { Metadata } from "next";

import { vipEventsContent } from "./lib/vipEventsContent";

export const metadata: Metadata = {
  title: "VIP Events — Shamell Entertainment",
  description: vipEventsContent.description,
};

export default function VipEventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
