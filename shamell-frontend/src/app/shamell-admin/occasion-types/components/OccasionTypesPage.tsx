"use client";

import { useOccasionTypesPage } from "../hooks/useOccasionTypesPage";
import OccasionTypesPageContent from "./OccasionTypesPageContent";

export default function OccasionTypesPage() {
  const state = useOccasionTypesPage();
  return <OccasionTypesPageContent state={state} />;
}
