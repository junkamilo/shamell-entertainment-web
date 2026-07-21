import {
  AGENDAR_PATH,
  AGENDA_DISPONIBILIDAD_PATH,
  AGENDA_MI_AGENDA_PATH,
  AGENDA_PAYMENT_HISTORY_PATH,
  AGENDA_PETICIONES_PATH,
} from "./agendaRoutes";
import { AGENDA_HUB_ICON } from "./agendaHubIcons";
import type { AgendaHubCard } from "../types/agendaHub.types";

export const AGENDA_HUB_CARDS: AgendaHubCard[] = [
  {
    href: AGENDAR_PATH,
    title: "Book",
    subtitle:
      "New booking by phone or in person: service, event type, date, and client.",
    iconSrc: AGENDA_HUB_ICON.book,
    fire: false,
  },
  {
    href: AGENDA_DISPONIBILIDAD_PATH,
    title: "Availability",
    subtitle:
      "Weekly hours and closed days (one-off dates or recurring, e.g. every Sunday).",
    iconSrc: AGENDA_HUB_ICON.availability,
    fire: false,
  },
  {
    href: AGENDA_PETICIONES_PATH,
    title: "Inbox",
    subtitle:
      "Messages from the public contact form; review details and mark as read.",
    iconSrc: AGENDA_HUB_ICON.inbox,
    fire: true,
    badgeKey: "peticionesBadge",
  },
  {
    href: AGENDA_PAYMENT_HISTORY_PATH,
    title: "Payment history",
    subtitle:
      "All Stripe payments: bookings, venue seats, classes, and fixed tickets.",
    iconSrc: AGENDA_HUB_ICON.paymentHistory,
    fire: false,
    badgeKey: "paymentHistoryBadge",
  },
  {
    href: AGENDA_MI_AGENDA_PATH,
    title: "My calendar",
    subtitle: "Week view of confirmed bookings, times, and scheduled events.",
    iconSrc: AGENDA_HUB_ICON.myCalendar,
    fire: false,
  },
];
