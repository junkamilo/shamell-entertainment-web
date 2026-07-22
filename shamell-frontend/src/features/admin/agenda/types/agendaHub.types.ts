export type AgendaHubBadges = {
  peticionesBadge: number;
  paymentHistoryBadge: number;
};

export type AgendaHubCard = {
  href: string;
  title: string;
  subtitle: string;
  iconSrc: string;
  fire: boolean;
  badgeKey?: keyof AgendaHubBadges;
};

export type AgendaHubCardProps = {
  card: AgendaHubCard;
  badgeCount?: number;
};