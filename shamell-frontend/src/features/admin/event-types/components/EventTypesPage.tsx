"use client";

import { useEventTypesPage } from "../hooks/useEventTypesPage";
import EventTypesPageContent from "./EventTypesPageContent";

export default function EventTypesPage() {
  const state = useEventTypesPage();
  return <EventTypesPageContent state={state} />;
}
