import { PrismaService } from '../../prisma/prisma.service';
import type { SanitizedInquiryDetails } from './contact-inquiry-details';

export type GuideInvestmentCompute = {
  /** Sum of known guide prices (event + services); null when nothing numeric to show. */
  totalUsd: number | null;
  /** True when catalog event or at least one selected service lacks a guide price in DB. */
  isPartial: boolean;
};

function decimalToUsd(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Sums public catalog guide prices: active Event row (by eventId or eventTypeId) plus Service rows for serviceIds.
 * Matches the booking inquiry pricing preview on the site (occasion types have no price).
 */
export async function computeBookingGuideInvestmentUsd(
  prisma: PrismaService,
  details: SanitizedInquiryDetails,
): Promise<GuideInvestmentCompute> {
  const hasEventSlot = Boolean(details.eventId || details.eventTypeId);
  const serviceIds = details.serviceIds ?? [];
  const hasServices = serviceIds.length > 0;

  if (!hasEventSlot && !hasServices) {
    return { totalUsd: null, isPartial: false };
  }

  let eventPartial = false;
  let eventUsd: number | null = null;

  if (details.eventId) {
    const ev = await prisma.event.findUnique({
      where: { id: details.eventId },
      select: { price: true },
    });
    if (!ev) {
      eventPartial = true;
    } else {
      const p = decimalToUsd(ev.price);
      if (p === null) eventPartial = true;
      else eventUsd = p;
    }
  } else if (details.eventTypeId) {
    const ev = await prisma.event.findUnique({
      where: { eventTypeId: details.eventTypeId },
      select: { price: true },
    });
    if (!ev) {
      eventPartial = true;
    } else {
      const p = decimalToUsd(ev.price);
      if (p === null) eventPartial = true;
      else eventUsd = p;
    }
  }

  let servicePartial = false;
  let serviceSum = 0;
  if (hasServices) {
    const rows = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, price: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const id of serviceIds) {
      const row = byId.get(id);
      if (!row) {
        servicePartial = true;
        continue;
      }
      const p = decimalToUsd(row.price);
      if (p === null) {
        servicePartial = true;
      } else {
        serviceSum += p;
      }
    }
  }

  const sum = (eventUsd ?? 0) + serviceSum;
  const totalUsd = sum > 0 ? roundUsd(sum) : null;
  const isPartial = eventPartial || servicePartial;

  return { totalUsd, isPartial };
}
