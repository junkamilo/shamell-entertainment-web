import { AGENDA_HUB_ICON } from "../../lib/agendaHubIcons";
import { AGENDA_PETICIONES_PATH } from "../../lib/agendaRoutes";
import type { AgendaHubBadges, AgendaHubCard } from "../../types/agendaHub.types";

export function makeAgendaHubBadges(
  overrides: Partial<AgendaHubBadges> = {},
): AgendaHubBadges {
  return {
    peticionesBadge: 0,
    paymentHistoryBadge: 0,
    ...overrides,
  };
}

export function makeAgendaHubCard(
  overrides: Partial<AgendaHubCard> = {},
): AgendaHubCard {
  return {
    href: AGENDA_PETICIONES_PATH,
    title: "Inbox",
    subtitle: "Messages from the public contact form.",
    iconSrc: AGENDA_HUB_ICON.inbox,
    fire: true,
    badgeKey: "peticionesBadge",
    ...overrides,
  };
}
