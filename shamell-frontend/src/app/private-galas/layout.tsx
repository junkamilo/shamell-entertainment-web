import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Galas — Shamell Entertainment",
  description:
    "Elevate your private celebration with a mesmerizing performance designed exclusively for your event. From intimate dinner parties to grand estate gatherings, Shamell brings artistry, elegance, and a commanding presence that transforms any occasion into an extraordinary experience.",
};

export default function PrivateGalasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
