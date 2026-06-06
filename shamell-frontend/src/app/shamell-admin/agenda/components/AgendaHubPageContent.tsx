"use client";

import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  CreditCard,
  Inbox,
  LayoutDashboard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import {
  AGENDAR_PATH,
  AGENDA_DISPONIBILIDAD_PATH,
  AGENDA_MI_AGENDA_PATH,
  AGENDA_PAYMENT_HISTORY_PATH,
  AGENDA_PETICIONES_PATH,
} from "../agendar/lib/agendarRoutes";
import type { AgendaHubBadges } from "../hooks/useAgendaHubBadge";

type AgendaHubCard = {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  fire: boolean;
  badgeKey?: keyof AgendaHubBadges;
};

const cards: AgendaHubCard[] = [
  {
    href: AGENDAR_PATH,
    title: "Book",
    subtitle:
      "New booking by phone or in person: service, event type, date, and client.",
    icon: CalendarDays,
    fire: false,
  },
  {
    href: AGENDA_DISPONIBILIDAD_PATH,
    title: "Availability",
    subtitle:
      "Weekly hours and closed days (one-off dates or recurring, e.g. every Sunday).",
    icon: CalendarClock,
    fire: false,
  },
  {
    href: AGENDA_PETICIONES_PATH,
    title: "Inbox",
    subtitle:
      "Messages from the public contact form; review details and mark as read.",
    icon: Inbox,
    fire: true,
    badgeKey: "peticionesBadge",
  },
  {
    href: AGENDA_PAYMENT_HISTORY_PATH,
    title: "Payment history",
    subtitle:
      "All Stripe payments: bookings, venue seats, classes, and fixed tickets.",
    icon: CreditCard,
    fire: false,
    badgeKey: "paymentHistoryBadge",
  },
  {
    href: AGENDA_MI_AGENDA_PATH,
    title: "My calendar",
    subtitle: "Week view of confirmed bookings, times, and scheduled events.",
    icon: LayoutDashboard,
    fire: false,
  },
];

type AgendaHubPageContentProps = AgendaHubBadges;

export default function AgendaHubPageContent({
  peticionesBadge,
  paymentHistoryBadge,
}: AgendaHubPageContentProps) {
  const badgeCounts: AgendaHubBadges = {
    peticionesBadge,
    paymentHistoryBadge,
  };
  const totalNotifications = peticionesBadge + paymentHistoryBadge;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <AdminModuleHero
        title="Schedule"
        actionLabel="Open inbox"
        actionHref={AGENDA_PETICIONES_PATH}
        bordered={false}
        subtitle={
          totalNotifications > 0 ? (
            <span className="inline-flex items-center gap-2 text-sm text-gold/90">
              {totalNotifications} payment or inbox update
              {totalNotifications === 1 ? "" : "s"} since your last visit
            </span>
          ) : undefined
        }
      />

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map(({ href, title, subtitle, icon: Icon, fire, badgeKey }) => {
          const badgeCount = badgeKey ? badgeCounts[badgeKey] : 0;
          return (
            <Link
              key={href}
              href={href}
              className={`group shamell-glass-card relative ${fire ? "shamell-glass-card--fire" : ""}`}
            >
              {badgeCount > 0 ? (
                <span className="absolute right-3 top-3 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border border-gold/45 bg-gold/20 px-1.5 font-brand text-[10px] tracking-widest text-gold">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              ) : null}
              <div className="shamell-icon-box">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <p className="mt-5 font-brand text-xs tracking-[0.18em] text-gold sm:text-sm">
                {title.toUpperCase()}
              </p>
              <p className="mt-3 font-elegant text-xl leading-[1.65] text-foreground/92 sm:font-body sm:text-base sm:leading-relaxed sm:text-foreground/82 md:text-[1.0625rem]">
                {subtitle}
              </p>
              <span className="mt-4 font-brand text-xs tracking-[0.14em] text-gold/75 group-hover:text-gold sm:text-[11px]">
                OPEN →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
