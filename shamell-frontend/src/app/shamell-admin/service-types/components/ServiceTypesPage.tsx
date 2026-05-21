"use client";

import { useServiceTypesPage } from "../hooks/useServiceTypesPage";
import ServiceTypesPageContent from "./ServiceTypesPageContent";

export default function ServiceTypesPage() {
  const state = useServiceTypesPage();
  return <ServiceTypesPageContent state={state} />;
}
