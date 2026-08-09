import { BadRequestException } from '@nestjs/common';
import { parseHHMM } from '../../availability/utils/booking-tz';
import { PRIVATE_CLASS_DETAILS_KIND } from '../constants/bookings.constants';
import type { PrivateClassBookingDetails } from '../types/bookings.types';
import type { CreatePrivateClassBookingDto } from '../dto/create-private-class-booking.dto';

function addOneHourHhmm(hhmm: string): string {
  const minutes = parseHHMM(hhmm, 'eventTimeStart');
  const next = Math.min(minutes + 60, 23 * 60 + 59);
  const h = Math.floor(next / 60);
  const m = next % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function buildPrivateClassDetails(
  dto: CreatePrivateClassBookingDto,
  paymentMethod: 'stripe' | 'cash',
): PrivateClassBookingDetails {
  const start = dto.eventTimeStart.trim();
  const end = addOneHourHhmm(start);
  const amount = Number(dto.amountUsd);
  if (!Number.isFinite(amount) || amount < 1) {
    throw new BadRequestException('amountUsd must be at least 1.');
  }
  return {
    kind: PRIVATE_CLASS_DETAILS_KIND,
    classType: dto.classType.trim(),
    eventTimeStart: start,
    eventTimeEnd: end,
    location: dto.location.trim(),
    paymentMethod,
    amountUsd: Number(amount.toFixed(2)),
    currency: 'usd',
    submittedAt: new Date().toISOString(),
    source: 'admin_book_class_private',
  };
}
