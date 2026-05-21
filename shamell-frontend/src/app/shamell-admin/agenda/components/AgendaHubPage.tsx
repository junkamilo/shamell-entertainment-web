"use client";

import { useAgendaHubBadge } from "../hooks/useAgendaHubBadge";
import AgendaHubPageContent from "./AgendaHubPageContent";

export default function AgendaHubPage() {
  const peticionesBadge = useAgendaHubBadge();
  return <AgendaHubPageContent peticionesBadge={peticionesBadge} />;
}
