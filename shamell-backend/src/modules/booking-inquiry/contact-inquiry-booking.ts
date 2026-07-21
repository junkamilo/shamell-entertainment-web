import type { PrismaService } from '../../prisma/prisma.service';
import type { ContactInquiryCode } from '../../common/contact-inquiry-codes';
import { bookingInquiryCatalogEventWhere } from '../events/booking-inquiry-catalog.util';
import type { SanitizedInquiryDetails } from './contact-inquiry-details';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimUuid(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return UUID_REGEX.test(t) ? t : undefined;
}

/** Valid service UUIDs from inquiry details (order preserved, deduped). */
export function parseInquiryServiceIds(
  details: SanitizedInquiryDetails | undefined,
): string[] {
  if (!details?.serviceIds?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of details.serviceIds) {
    const id = trimUuid(item);
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

async function serviceIdForInquiryCode(
  prisma: PrismaService,
  code: string,
): Promise<string | null> {
  const row = await prisma.service.findFirst({
    where: {
      isActive: true,
      serviceType: {
        isActive: true,
        contactInquiryCode: code.trim().toUpperCase(),
      },
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return row?.id ?? null;
}

/**
 * Resolves catalog `serviceId` for a public booking inquiry (mirrors admin Inbox / Agendar).
 */
export async function resolvePrimaryServiceIdForInquiry(
  prisma: PrismaService,
  details: SanitizedInquiryDetails | undefined,
  serviceType?: ContactInquiryCode,
): Promise<string | null> {
  const fromList = parseInquiryServiceIds(details);
  if (fromList.length > 0) return fromList[0];

  if (details?.sourceCatalogKind === 'service') {
    const catId = trimUuid(details.sourceCatalogId);
    if (catId) {
      const row = await prisma.service.findFirst({
        where: { id: catId, isActive: true },
        select: { id: true },
      });
      if (row) return row.id;
    }
  }

  if (serviceType) {
    const byCode = await serviceIdForInquiryCode(prisma, serviceType);
    if (byCode) return byCode;
  }

  const eventTypeId = trimUuid(details?.eventTypeId);
  if (eventTypeId) {
    const et = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
      select: { contactInquiryCode: true },
    });
    const code = et?.contactInquiryCode?.trim();
    if (code) {
      const byEt = await serviceIdForInquiryCode(prisma, code);
      if (byEt) return byEt;
    }
  }

  const eventId = trimUuid(details?.eventId);
  if (eventId) {
    const ev = await prisma.event.findFirst({
      where: { id: eventId, ...bookingInquiryCatalogEventWhere },
      select: { eventType: { select: { contactInquiryCode: true } } },
    });
    const code = ev?.eventType.contactInquiryCode?.trim();
    if (code) {
      const byEv = await serviceIdForInquiryCode(prisma, code);
      if (byEv) return byEv;
    }
  }

  return null;
}

export function bookingDetailsForPublicInquiry(
  details: SanitizedInquiryDetails,
  primaryServiceId: string,
): SanitizedInquiryDetails {
  const parsed = parseInquiryServiceIds(details);
  const out: SanitizedInquiryDetails = { ...details };
  if (parsed.length > 0) {
    out.serviceIds = parsed;
  } else {
    delete out.serviceIds;
  }
  if (!out.serviceIds?.length) {
    out.serviceIds = [primaryServiceId];
  } else if (out.serviceIds[0] !== primaryServiceId) {
    out.serviceIds = [
      primaryServiceId,
      ...out.serviceIds.filter((id) => id !== primaryServiceId),
    ];
  }
  return out;
}
