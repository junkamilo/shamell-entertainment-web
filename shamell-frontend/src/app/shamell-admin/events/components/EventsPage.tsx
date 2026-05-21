"use client";

import { useEventsPage } from "../hooks/useEventsPage";
import EventsPageContent from "./EventsPageContent";

export default function EventsPage() {
  const state = useEventsPage();
  return <EventsPageContent state={state} />;
}
