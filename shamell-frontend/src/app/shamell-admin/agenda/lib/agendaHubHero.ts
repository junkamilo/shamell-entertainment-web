import { AGENDA_PETICIONES_PATH } from "./agendaRoutes";

export const AGENDA_HUB_HERO = {
  title: "Schedule",
  actionLabel: "Open inbox",
  actionHref: AGENDA_PETICIONES_PATH,
} as const;

/** Hub hero subtitle when inbox or payment badges are pending. */
export function formatAgendaHubNotificationSubtitle(total: number): string | null {
  if (total <= 0) return null;
  return `${total} payment or inbox update${total === 1 ? "" : "s"} since your last visit`;
}
