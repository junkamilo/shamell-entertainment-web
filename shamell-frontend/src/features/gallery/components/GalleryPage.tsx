"use client";

import { Suspense } from "react";
import { Footer, SiteHeader } from "@/components/shared";
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

export default GalleryPage;
