"use client";

import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { GalleryPageContent } from "./GalleryPageContent";
import { GalleryPageFallback } from "./GalleryPageFallback";

export function GalleryPage() {
  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />
      <Suspense fallback={<GalleryPageFallback />}>
        <GalleryPageContent />
      </Suspense>
      <Footer />
    </main>
  );
}
