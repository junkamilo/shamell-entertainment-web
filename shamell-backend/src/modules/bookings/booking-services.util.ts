import type { Prisma } from '@prisma/client';
import { sanitizeInquiryDetails } from '../booking-inquiry/contact-inquiry-details';

type TxClient = Prisma.TransactionClient;

export function resolveBookingServiceIds(
  primaryServiceId: string,
  bookingDetails?: unknown,
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  const push = (id: string) => {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    ids.push(trimmed);
  };

  if (bookingDetails && typeof bookingDetails === 'object') {
    try {
      const parsed = sanitizeInquiryDetails(bookingDetails);
      parsed?.serviceIds?.forEach((id) => push(id));
    } catch {
      // ignore invalid details; fall back to primary
    }
  }

  push(primaryServiceId);

  if (ids.length === 0 && primaryServiceId.trim()) {
    push(primaryServiceId);
  }

  if (ids[0] !== primaryServiceId.trim()) {
    const primary = primaryServiceId.trim();
    const rest = ids.filter((id) => id !== primary);
    return [primary, ...rest];
  }

  return ids;
}

export async function syncBookingServices(
  tx: TxClient,
  bookingId: string,
  serviceIds: string[],
): Promise<void> {
  const normalized = serviceIds.map((id) => id.trim()).filter(Boolean);
  await tx.bookingService.deleteMany({ where: { bookingId } });
  if (normalized.length === 0) return;

  await tx.bookingService.createMany({
    data: normalized.map((serviceId, sortOrder) => ({
      bookingId,
      serviceId,
      sortOrder,
    })),
    skipDuplicates: true,
  });
}
