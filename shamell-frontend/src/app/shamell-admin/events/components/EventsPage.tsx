"use client";

import { useEventsPage } from "../hooks/useEventsPage";
import EventsPageContent from "./EventsPageContent";

type Props = {
  embedded?: boolean;
  upcomingOnly?: boolean;
};

export default function EventsPage({ embedded, upcomingOnly }: Props) {
  const state = useEventsPage({ embedded, upcomingOnly });
  return <EventsPageContent state={state} />;
}
