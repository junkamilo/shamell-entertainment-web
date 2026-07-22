"use client";

import { useGalleryCategoriesPage } from "../hooks/useGalleryCategoriesPage";
import GalleryCategoriesPageContent from "./GalleryCategoriesPageContent";

export default function GalleryCategoriesPage() {
  const state = useGalleryCategoriesPage();
  return <GalleryCategoriesPageContent state={state} />;
}
