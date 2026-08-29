type ActivityRow = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl?: string | null;
  mediaPublicId?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | null;
  accentColor: string | null;
  showText?: boolean;
  displayOrder: number;
};

type PackageActivityLink = {
  displayOrder: number;
  activity: ActivityRow;
};

type PackageRow = {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  priceCents: number;
  capacity: number;
  arrivalStartTime: Date;
  arrivalEndTime: Date | null;
  displayOrder: number;
  isActive: boolean;
  activityLinks: PackageActivityLink[];
};

export type FixedEventActivityPublicDto = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | null;
  accentColor: string | null;
  showText: boolean;
  displayOrder: number;
};

export type FixedEventPackagePublicDto = {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  price: number;
  priceCents: number;
  arrivalLabel: string;
  inclusionSummary: string;
  activities: FixedEventActivityPublicDto[];
  displayOrder: number;
  capacity: number;
  ticketsRemaining: number;
  ticketsSold: number;
  soldOut: boolean;
  isActive: boolean;
};

export function mapActivityPublic(a: ActivityRow): FixedEventActivityPublicDto {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    mediaUrl: a.mediaUrl ?? null,
    mediaType: a.mediaType ?? null,
    accentColor: a.accentColor,
    showText:
      a.showText === false && Boolean(a.mediaUrl?.trim()) ? false : true,
    displayOrder: a.displayOrder,
  };
}

export function formatTime12h(time: Date): string {
  const h = time.getUTCHours();
  const m = time.getUTCMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return m === 0
    ? `${hour12}:00 ${period}`
    : `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatArrivalLabel(start: Date, end: Date | null): string {
  const startLabel = formatTime12h(start);
  if (!end) return startLabel;
  return `${startLabel} – ${formatTime12h(end)}`;
}

export function buildInclusionSummary(links: PackageActivityLink[]): string {
  return links
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((l) => l.activity.title)
    .join(' + ');
}

export function parseTimeToDate(timeStr: string): Date {
  const parts = timeStr.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  const s = Number(parts[2] ?? 0);
  return new Date(Date.UTC(1970, 0, 1, h, m, s));
}

export function mapPackagePublic(
  pkg: PackageRow,
  inventory: { blocking: number; remaining: number; sold: number },
): FixedEventPackagePublicDto {
  const activities = pkg.activityLinks
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((l) => mapActivityPublic(l.activity));

  return {
    id: pkg.id,
    title: pkg.title,
    description: pkg.description,
    badge: pkg.badge,
    price: pkg.priceCents / 100,
    priceCents: pkg.priceCents,
    arrivalLabel: formatArrivalLabel(pkg.arrivalStartTime, pkg.arrivalEndTime),
    inclusionSummary: buildInclusionSummary(pkg.activityLinks),
    activities,
    displayOrder: pkg.displayOrder,
    capacity: pkg.capacity,
    ticketsRemaining: inventory.remaining,
    ticketsSold: inventory.sold,
    soldOut: inventory.remaining <= 0,
    isActive: pkg.isActive,
  };
}

export function buildPackageSnapshotInclusions(
  links: PackageActivityLink[],
): { title: string; displayOrder: number }[] {
  return links
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((l) => ({
      title: l.activity.title,
      displayOrder: l.displayOrder,
    }));
}

export function mapActivityAdmin(a: ActivityRow & { isActive?: boolean }) {
  return mapActivityPublic(a);
}

export function mapPackageAdmin(pkg: PackageRow, blocking?: number) {
  const sold = blocking ?? 0;
  return {
    id: pkg.id,
    title: pkg.title,
    description: pkg.description,
    badge: pkg.badge,
    priceCents: pkg.priceCents,
    price: pkg.priceCents / 100,
    capacity: pkg.capacity,
    arrivalStartTime: formatTime24(pkg.arrivalStartTime),
    arrivalEndTime: pkg.arrivalEndTime
      ? formatTime24(pkg.arrivalEndTime)
      : null,
    arrivalLabel: formatArrivalLabel(pkg.arrivalStartTime, pkg.arrivalEndTime),
    displayOrder: pkg.displayOrder,
    isActive: pkg.isActive,
    activityIds: pkg.activityLinks
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((l) => l.activity.id),
    activities: pkg.activityLinks
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((l) => mapActivityPublic(l.activity)),
    blockingCount: sold,
    remaining: Math.max(0, pkg.capacity - sold),
  };
}

function formatTime24(time: Date): string {
  const h = String(time.getUTCHours()).padStart(2, '0');
  const m = String(time.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
