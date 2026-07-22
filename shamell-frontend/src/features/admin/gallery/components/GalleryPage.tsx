"use client";

import { useGalleryPage } from "../hooks/useGalleryPage";
import GalleryPageContent from "./GalleryPageContent";

export default function GalleryPage() {
  const state = useGalleryPage();
  return <GalleryPageContent state={state} />;
}
