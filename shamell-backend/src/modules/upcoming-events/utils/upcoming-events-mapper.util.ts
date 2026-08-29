import {
  FixedTicketMode,
  GalleryMediaType,
  Prisma,
  UpcomingExperienceType,
} from '@prisma/client';
import { buildTemplateSummary } from '../../reservation-event-templates/utils/reservation-event-template.util';

export function effectiveGalleryMediaType(
  imageUrl: string | null | undefined,
  mediaType?: GalleryMediaType | null,
): GalleryMediaType {
  const u = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  if (u) {
    const lower = u.toLowerCase();
    if (
      lower.includes('/video/upload/') ||
      /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(lower)
    ) {
      return GalleryMediaType.VIDEO;
    }
  }
  return mediaType ?? GalleryMediaType.IMAGE;
}

export function mapPublicHero(event: {
  galleryPhotos?: Array<{ imageUrl: string; mediaType: GalleryMediaType }>;
}) {
  const first = event.galleryPhotos?.[0];
  if (!first) {
    return {
      heroImageUrl: null as string | null,
      heroMediaType: null as 'IMAGE' | 'VIDEO' | null,
    };
  }
  const heroMediaType = effectiveGalleryMediaType(
    first.imageUrl,
    first.mediaType,
  );
  return {
    heroImageUrl: first.imageUrl,
    heroMediaType: heroMediaType === GalleryMediaType.VIDEO ? 'VIDEO' : 'IMAGE',
  };
}

export function sessionCalendarDateIso(
  startsAt: Date,
  timezone: string,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(startsAt);
}

export function sessionLabel(session: {
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  section?: {
    label: string | null;
    startTime: string;
    endTime: string;
  } | null;
}) {
  const when = session.startsAt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: session.timezone,
  });
  const sectionPart = session.section?.label
    ? `${session.section.label} (${session.section.startTime}-${session.section.endTime})`
    : session.section
      ? `${session.section.startTime}-${session.section.endTime}`
      : null;
  return sectionPart ? `${when} - ${sectionPart}` : when;
}

export function mapPublicSummary(event: {
  id: string;
  slug: string | null;
  description: string;
  items: string[];
  price: unknown;
  experienceType: UpcomingExperienceType | null;
  classVariant: string | null;
  eventType: { name: string };
}) {
  return {
    id: event.id,
    slug: event.slug,
    eventTypeName: event.eventType.name,
    description: event.description,
    items: event.items,
    price: event.price != null ? Number(event.price) : null,
    experienceType: event.experienceType,
    classVariant: event.classVariant,
  };
}

export function mapSessionPublic(session: {
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

export function mapSessionAdmin(session: {
  id: string;
  eventId: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  capacity: number;
  price: unknown;
  currency: string;
  isActive: boolean;
  sortOrder: number;
}) {
  return {
    ...mapSessionPublic(session),
    isActive: session.isActive,
    sortOrder: session.sortOrder,
  };
}

export function mapVenueConfig(config: {
  id: string;
  eventId: string;
  clientEnabled: boolean;
  promoTitle: string | null;
  promoDescription: string | null;
  promoImageUrl: string | null;
  reservationEventDate: Date | null;
  reservationOpensAt: Date | null;
  reservationClosesAt: Date | null;
  reservationEventLabel: string | null;
  reservationTimezone: string;
  floorLayoutId: string | null;
  fixedTicketCapacity?: number | null;
  fixedTicketMode?: FixedTicketMode;
  classPackageEnabled?: boolean;
  classPackagePrice?: unknown;
  classPackageLabel?: string | null;
  reservationEventTemplateId?: string | null;
  reservationEventTemplate?: Prisma.ReservationEventTemplateGetPayload<{
    include: { weekdays: true; classSections: true };
  }> | null;
}) {
  const template = config.reservationEventTemplate;
  return {
    id: config.id,
    eventId: config.eventId,
    clientEnabled: config.clientEnabled,
    promoTitle: config.promoTitle,
    promoDescription: config.promoDescription,
    promoImageUrl: config.promoImageUrl,
    reservationEventDate: config.reservationEventDate?.toISOString() ?? null,
    reservationOpensAt: config.reservationOpensAt?.toISOString() ?? null,
    reservationClosesAt: config.reservationClosesAt?.toISOString() ?? null,
    reservationEventLabel: config.reservationEventLabel,
    reservationTimezone: config.reservationTimezone,
    floorLayoutId: config.floorLayoutId,
    fixedTicketCapacity: config.fixedTicketCapacity ?? null,
    fixedTicketMode: config.fixedTicketMode ?? FixedTicketMode.SINGLE,
    classPackageEnabled: config.classPackageEnabled ?? false,
    classPackagePrice:
      config.classPackagePrice != null
        ? Number(config.classPackagePrice)
        : null,
    classPackageLabel: config.classPackageLabel ?? null,
    reservationEventTemplateId: config.reservationEventTemplateId ?? null,
    reservationEventTemplate: template
      ? {
          id: template.id,
          name: template.name,
          timezone: template.timezone,
          scheduleMode: template.scheduleMode,
          salesStartDate:
            template.salesStartDate?.toISOString().slice(0, 10) ?? null,
          salesEndDate:
            template.salesEndDate?.toISOString().slice(0, 10) ?? null,
          eventDate: template.eventDate?.toISOString().slice(0, 10) ?? null,
          eventStartTime: template.eventStartTime,
          eventEndTime: template.eventEndTime,
          recurringEffectiveFrom:
            template.recurringEffectiveFrom?.toISOString().slice(0, 10) ?? null,
          recurringStartTime: template.recurringStartTime,
          recurringEndTime: template.recurringEndTime,
          weekdays: template.weekdays.map((w) => ({
            weekday: w.weekday,
            isActive: w.isActive,
          })),
          classSections: (template.classSections ?? []).map((s) => ({
            id: s.id,
            weekday: s.weekday,
            label: s.label,
            startTime: s.startTime,
            endTime: s.endTime,
            sortOrder: s.sortOrder,
            defaultCapacity: s.defaultCapacity,
            defaultPrice:
              s.defaultPrice != null ? Number(s.defaultPrice) : null,
            isActive: s.isActive,
          })),
          summary: buildTemplateSummary(template),
        }
      : null,
  };
}
