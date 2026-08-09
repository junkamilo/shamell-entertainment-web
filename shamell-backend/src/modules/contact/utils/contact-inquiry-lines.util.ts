import type { CreateContactDto } from '../dto/create-contact.dto';

/** Short detail lines for admin activity notify (phone / date / location / message excerpt). */
export function contactInquiryDetailLines(dto: CreateContactDto): string[] {
  const lines: string[] = [];
  const phone = dto.phone?.trim();
  if (phone) lines.push(`Phone: ${phone}`);
  const eventDate = dto.eventDate?.trim();
  if (eventDate) lines.push(`Event date: ${eventDate}`);
  const location = dto.location?.trim();
  if (location) lines.push(`Location: ${location}`);
  const message = dto.message.trim();
  if (message) {
    const excerpt =
      message.length > 280 ? `${message.slice(0, 277)}…` : message;
    lines.push(`Message: ${excerpt}`);
  }
  return lines;
}
