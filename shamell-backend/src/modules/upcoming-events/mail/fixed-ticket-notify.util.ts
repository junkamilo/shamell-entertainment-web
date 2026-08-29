import {
  formatPackageInclusionTitles,
  packageSnapshotFromEnrollment,
  type FixedTicketPackageSnapshot,
} from './fixed-ticket-confirmation.mail';

/** Same UUID shown to the customer and Shamell ops — matches enrollment.id. */
export function fixedTicketVerificationCode(enrollmentId: string): string {
  return enrollmentId.trim().toLowerCase();
}

export function buildFixedTicketAdminContextLabel(input: {
  eventName: string;
  ticketNumber?: number | null;
  packageTitle?: string | null;
}): string {
  const parts = [input.eventName.trim()];
  if (input.packageTitle?.trim()) {
    parts.push(`Package: ${input.packageTitle.trim()}`);
  }
  if (input.ticketNumber != null) {
    parts.push(`Ticket #${input.ticketNumber}`);
  }
  return parts.join(' — ');
}

export function buildFixedTicketAdminDetailsLines(input: {
  package?: FixedTicketPackageSnapshot | null;
  ticketNumber?: number | null;
  eventDateLabel?: string | null;
}): string[] {
  const lines: string[] = [];
  if (input.ticketNumber != null) {
    lines.push(`Ticket #: ${input.ticketNumber}`);
  }
  if (input.package?.packageTitle) {
    lines.push(`Package: ${input.package.packageTitle}`);
  }
  if (input.package?.packageArrivalLabel?.trim()) {
    lines.push(`Arrival: ${input.package.packageArrivalLabel.trim()}`);
  }
  const includes = formatPackageInclusionTitles(
    input.package?.packageInclusions,
  );
  if (includes.length) {
    lines.push(`Includes: ${includes.join(', ')}`);
  }
  if (input.eventDateLabel?.trim()) {
    lines.push(`Event: ${input.eventDateLabel.trim()}`);
  }
  return lines;
}

export function fixedTicketNotifyFieldsFromEnrollment(
  enrollment: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    amount: { toString(): string } | number;
    currency: string;
    ticketNumber?: number | null;
    packageTitle?: string | null;
    packageArrivalLabel?: string | null;
    packageInclusions?: unknown;
    event: { eventType: { name: string } };
  },
  eventDateLabel?: string | null,
) {
  const pkg = packageSnapshotFromEnrollment(enrollment);
  const eventName = enrollment.event.eventType.name;
  return {
    customerName: enrollment.customerName,
    customerEmail: enrollment.customerEmail,
    customerPhone: enrollment.customerPhone?.trim() || null,
    amount: Number(enrollment.amount),
    currency: enrollment.currency,
    contextLabel: buildFixedTicketAdminContextLabel({
      eventName,
      ticketNumber: enrollment.ticketNumber,
      packageTitle: pkg?.packageTitle ?? enrollment.packageTitle,
    }),
    reference: fixedTicketVerificationCode(enrollment.id),
    detailsLines: buildFixedTicketAdminDetailsLines({
      package: pkg,
      ticketNumber: enrollment.ticketNumber,
      eventDateLabel,
    }),
  };
}
