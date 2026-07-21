export function mapClassSessionPublic(session: {
  id: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  capacity: number;
  price: unknown;
  currency: string;
  weekday?: number | null;
  sectionId?: string | null;
  section?: {
    label: string | null;
    startTime: string;
    endTime: string;
  } | null;
}) {
  return {
    id: session.id,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    timezone: session.timezone,
    capacity: session.capacity,
    price: Number(session.price),
    currency: session.currency,
    weekday: session.weekday ?? null,
    sectionId: session.sectionId ?? null,
    sectionLabel: session.section?.label ?? null,
    sectionStartTime: session.section?.startTime ?? null,
    sectionEndTime: session.section?.endTime ?? null,
  };
}
