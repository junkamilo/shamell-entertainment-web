import { createHash } from 'crypto';
import { BookingQuotePaymentModel, BookingStatus } from '@prisma/client';

export function hashQuoteToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function isBookingFullyPaid(booking: {
  status: BookingStatus;
  depositPaidAt: Date | null;
  balancePaidAt: Date | null;
  quoteModel: BookingQuotePaymentModel | null;
}): boolean {
  return (
    Boolean(booking.balancePaidAt) ||
    (booking.status === BookingStatus.CONFIRMED &&
      booking.quoteModel === BookingQuotePaymentModel.FULL)
  );
}

export function buildQuotePayUrl(origin: string, token: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/pay/quote?token=${encodeURIComponent(token)}`;
}
