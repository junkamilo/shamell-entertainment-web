"use client";

import { useAgendaHubBadge } from "../hooks/useAgendaHubBadge";
import AgendaHubPageContent from "./AgendaHubPageContent";

export default function AgendaHubPage() {
  const badges = useAgendaHubBadge();
  return <AgendaHubPageContent {...badges} />;
}
