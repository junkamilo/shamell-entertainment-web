"use client";

import { useServicesPage } from "../hooks/useServicesPage";
import ServicesPageContent from "./ServicesPageContent";

export default function ServicesPage() {
  const state = useServicesPage();
  return <ServicesPageContent state={state} />;
}
