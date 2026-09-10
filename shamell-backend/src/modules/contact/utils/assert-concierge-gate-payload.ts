import { BadRequestException } from '@nestjs/common';
import { isConciergePlanningStage } from '../constants/concierge-planning-stage.constants';
import type { CreateContactDto } from '../dto/create-contact.dto';

const MAX_PHONE_LEN = 40;
const MAX_LOCATION_LEN = 300;
const MIN_GUEST_COUNT = 1;
const MAX_GUEST_COUNT = 100_000;

function inquiryRecord(
  dto: CreateContactDto,
): Record<string, unknown> | undefined {
  const raw = dto.inquiryDetails;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw;
  }
  return undefined;
}

/**
 * Concierge (`entrySource === concierge_gate`) requires extra fields that stay
 * optional on the shared contact DTO used by the booking wizard.
 */
export function assertConciergeGatePayload(dto: CreateContactDto): void {
  const details = inquiryRecord(dto);
  if (details?.entrySource !== 'concierge_gate') return;

  const phone = dto.phone?.trim() ?? '';
  if (!phone) {
    throw new BadRequestException('Phone is required.');
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || phone.length > MAX_PHONE_LEN) {
    throw new BadRequestException('Enter a valid phone number (7+ digits).');
  }

  const location = dto.location?.trim() ?? '';
  if (location.length < 2) {
    throw new BadRequestException('City or event location is required.');
  }
  if (location.length > MAX_LOCATION_LEN) {
    throw new BadRequestException(
      'City or event location must be at most 300 characters.',
    );
  }

  const eventDate = dto.eventDate?.trim() ?? '';
  if (!eventDate) {
    throw new BadRequestException('Tentative date is required.');
  }

  const guests = Number(details.guestCount);
  if (
    !Number.isInteger(guests) ||
    guests < MIN_GUEST_COUNT ||
    guests > MAX_GUEST_COUNT
  ) {
    throw new BadRequestException('Approximate guest count is required.');
  }

  if (!isConciergePlanningStage(details.planningStage)) {
    throw new BadRequestException('Planning stage is required.');
  }
}
