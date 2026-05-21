import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery — Shamell Entertainment",
  description:
    "Explore Shamell's fire performance, sword and candelabra, veil, and client gallery — photos and video from signature events.",
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
