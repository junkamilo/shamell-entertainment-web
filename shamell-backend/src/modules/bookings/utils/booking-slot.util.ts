import { BadRequestException } from '@nestjs/common';
import { parseHHMM, zonedWallClock } from '../../availability/utils/booking-tz';
import { sanitizeInquiryDetails } from '../../booking-inquiry/utils/contact-inquiry-details.util';
import type { SanitizedInquiryDetails } from '../../booking-inquiry/types/booking-inquiry.types';

export function validateBookingTimeRange(
  details?: SanitizedInquiryDetails,
): void {
  if (!details) return;
  const start = details.eventTimeStart?.trim();
  const end = details.eventTimeEnd?.trim();
  if (!start && !end) return;
  if (!start || !end) {
    throw new BadRequestException(
      'bookingDetails must include eventTimeStart and eventTimeEnd together.',
    );
  }
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    throw new BadRequestException(
      'bookingDetails.eventTimeStart/eventTimeEnd must be HH:mm.',
    );
  }
  const startM = parseHHMM(start, 'eventTimeStart');
  const endM = parseHHMM(end, 'eventTimeEnd');
  if (endM <= startM) {
    throw new BadRequestException(
      'bookingDetails.eventTimeEnd must be after eventTimeStart.',
    );
  }
}

export function bookingWindowFromEvent(
  eventDate: Date,
  bookingDetails: unknown,
  tz: string,
): { dateISO: string; startMinutes: number; endMinutes: number } {
  const wall = zonedWallClock(eventDate, tz);
  let startMinutes = wall.minutesSinceMidnight;
  let endMinutes = wall.minutesSinceMidnight;

  if (bookingDetails && typeof bookingDetails === 'object') {
    const parsed = sanitizeInquiryDetails(bookingDetails);
    if (parsed?.eventTimeStart && /^\d{2}:\d{2}$/.test(parsed.eventTimeStart)) {
      startMinutes = parseHHMM(parsed.eventTimeStart, 'eventTimeStart');
    }
    if (parsed?.eventTimeEnd && /^\d{2}:\d{2}$/.test(parsed.eventTimeEnd)) {
      endMinutes = parseHHMM(parsed.eventTimeEnd, 'eventTimeEnd');
    }
  }
  if (endMinutes < startMinutes) {
    endMinutes = startMinutes;
  }
  return { dateISO: wall.dateISO, startMinutes, endMinutes };
}

export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
