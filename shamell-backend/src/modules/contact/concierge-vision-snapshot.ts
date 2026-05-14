import type { CreateContactDto } from './dto/create-contact.dto';

/** Always 9 keys: mirrors "Tell us your vision" form; built server-side from validated DTO. */
export type ConciergeVisionSnapshot = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  /** ISO calendar date `YYYY-MM-DD`, or null if not provided. */
  eventDate: string | null;
  occasionHint: string;
  guestCount: number | null;
  planningStage: string;
  message: string;
};

function strOrEmpty(v: string | undefined): string {
  return typeof v === 'string' ? v.trim() : '';
}

function inquiryRecord(dto: CreateContactDto): Record<string, unknown> {
  const raw = dto.inquiryDetails;
  if (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw)
  ) {
    return raw as Record<string, unknown>;
  }
  return {};
}

/** Builds snapshot from `CreateContactDto` after validation (do not trust a client-only snapshot blob). */
export function buildConciergeVisionSnapshot(
  dto: CreateContactDto,
): ConciergeVisionSnapshot {
  const details = inquiryRecord(dto);

  let guestCount: number | null = null;
  if (details.guestCount !== undefined && details.guestCount !== null) {
    const n = Number(details.guestCount);
    if (Number.isInteger(n) && n >= 1) guestCount = n;
  }

  const eventRaw = dto.eventDate?.trim();
  const eventDate = eventRaw && eventRaw.length > 0 ? eventRaw : null;

  const planning =
    typeof details.planningStage === 'string'
      ? details.planningStage.trim()
      : '';
  const occasion =
    typeof details.occasionHint === 'string'
      ? details.occasionHint.trim()
      : '';

  return {
    fullName: dto.fullName.trim(),
    email: dto.email.trim(),
    phone: strOrEmpty(dto.phone),
    location: strOrEmpty(dto.location),
    eventDate,
    occasionHint: occasion,
    guestCount,
    planningStage: planning,
    message: dto.message.trim(),
  };
}
