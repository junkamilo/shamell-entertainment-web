"use client";

import { ModuleHero } from "@/components/admin/layout";
import { AGENDA_HUB_CARDS } from "../lib/agendaHubCards";
import { AGENDA_HUB_HERO, formatAgendaHubNotificationSubtitle } from "../lib/agendaHubHero";
import type { AgendaHubBadges } from "../types/agendaHub.types";
import AgendaHubCard from "./AgendaHubCard";

export default function AgendaHubPageContent({
  peticionesBadge,
  paymentHistoryBadge,
}: AgendaHubBadges) {
  const badgeCounts: AgendaHubBadges = {
    peticionesBadge,
    paymentHistoryBadge,
  };
  const notificationSubtitle = formatAgendaHubNotificationSubtitle(
    peticionesBadge + paymentHistoryBadge,
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ModuleHero
        title={AGENDA_HUB_HERO.title}
        actionLabel={AGENDA_HUB_HERO.actionLabel}
        actionHref={AGENDA_HUB_HERO.actionHref}
        bordered={false}
        subtitle={
          notificationSubtitle ? (
            <span className="inline-flex items-center gap-2 text-sm text-gold/90">
              {notificationSubtitle}
            </span>
          ) : undefined
        }
      />

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {AGENDA_HUB_CARDS.map((card) => (
          <AgendaHubCard
            key={card.href}
            card={card}
            badgeCount={card.badgeKey ? badgeCounts[card.badgeKey] : 0}
          />
        ))}
      </div>
    </div>
  );
}
