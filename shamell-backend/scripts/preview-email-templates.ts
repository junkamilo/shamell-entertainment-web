/**
 * Generate static HTML previews for all transactional email templates.
 * Usage: npx ts-node scripts/preview-email-templates.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { buildAdminCustomerActivityHtml } from '../src/modules/mail/admin-customer-activity.mail';
import { buildAdminInviteEmailHtml } from '../src/modules/mail/admin-invite.mail';
import { buildAdminPaymentOutcomeHtml } from '../src/modules/mail/admin-payment.mail';
import {
  buildBookingBalanceLinkHtml,
  buildBookingDepositPaidHtml,
  buildBookingFullyPaidHtml,
  buildBookingQuoteHtml,
} from '../src/modules/bookings/booking-quote.mail';
import { buildBookingConfirmationHtml } from '../src/modules/bookings/booking-confirmation.mail';
import { buildBookingInquiryAckHtml } from '../src/modules/contact/booking-inquiry-ack.mail';
import { buildConciergeInquiryAckHtml } from '../src/modules/contact/concierge-inquiry-ack.mail';
import { buildClassBundleConfirmationHtml } from '../src/modules/upcoming-events/class-bundle-confirmation.mail';
import { buildClassEnrollmentConfirmationHtml } from '../src/modules/upcoming-events/class-enrollment-confirmation.mail';
import { buildFixedTicketConfirmationHtml } from '../src/modules/upcoming-events/fixed-ticket-confirmation.mail';
import { buildVenueReservationConfirmationHtml } from '../src/modules/venue-reservations/venue-reservation-confirmation.mail';

const OUT_DIR = join(process.cwd(), 'tmp', 'email-previews');

const previews: { name: string; html: string }[] = [
  {
    name: 'admin-payment-paid',
    html: buildAdminPaymentOutcomeHtml({
      appPublicName: 'Shamell',
      outcome: 'PAID',
      flowLabel: 'Booking',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      amountUsd: '$2,500.00',
      contextLabel: 'Private gala',
      reference: '5e825440',
      stageLabel: 'Full payment',
    }),
  },
  {
    name: 'admin-customer-activity-inquiry',
    html: buildAdminCustomerActivityHtml({
      appPublicName: 'Shamell',
      kind: 'BOOKING_INQUIRY',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      contextLabel: 'Luxury birthday',
    }),
  },
  {
    name: 'admin-invite',
    html: buildAdminInviteEmailHtml({
      appName: 'Shamell Admin',
      fullName: 'New Admin',
      code: '123456',
    }),
  },
  {
    name: 'booking-quote',
    html: buildBookingQuoteHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      bookingReference: 'REF-001',
      totalAmountUsd: '$2,500.00',
      depositAmountUsd: '$1,000.00',
      payUrl: 'https://checkout.stripe.com/example',
    }),
  },
  {
    name: 'booking-deposit-paid',
    html: buildBookingDepositPaidHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      bookingReference: 'REF-001',
      amountUsd: '$1,000.00',
      eventDateLabel: 'June 15, 2026',
    }),
  },
  {
    name: 'booking-fully-paid',
    html: buildBookingFullyPaidHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      bookingReference: 'REF-001',
      amountUsd: '$2,500.00',
    }),
  },
  {
    name: 'booking-balance-link',
    html: buildBookingBalanceLinkHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      bookingReference: 'REF-001',
      totalAmountUsd: '$1,500.00',
      payUrl: 'https://checkout.stripe.com/example',
    }),
  },
  {
    name: 'booking-confirmation',
    html: buildBookingConfirmationHtml({
      recipientName: 'Jane Doe',
      timeZone: 'America/New_York',
      eventDate: new Date('2026-06-15T18:00:00Z'),
      eventTimeStart: '18:00',
      eventTimeEnd: '22:00',
      location: 'Miami, FL',
      serviceLabel: 'Private gala',
      appPublicName: 'Shamell',
      guestCount: 50,
    }),
  },
  {
    name: 'venue-reservation',
    html: buildVenueReservationConfirmationHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      eventDate: new Date('2026-06-15T20:00:00Z'),
      reservationTimezone: 'America/New_York',
      reservationKindLabel: 'Table',
      layoutItemLabel: 'Large table 1',
    }),
  },
  {
    name: 'booking-inquiry-ack',
    html: buildBookingInquiryAckHtml({
      recipientFirstName: 'Jane',
      appPublicName: 'Shamell',
      guideInvestment: { totalUsd: 2500, isPartial: false },
    }),
  },
  {
    name: 'concierge-inquiry-ack',
    html: buildConciergeInquiryAckHtml({
      recipientFirstName: 'Jane',
      appPublicName: 'Shamell',
    }),
  },
  {
    name: 'fixed-ticket',
    html: buildFixedTicketConfirmationHtml({
      eventName: 'Summer Gala',
      customerName: 'Jane',
      ticketNumber: 42,
      eventDateLabel: 'June 15, 2026',
      amount: '$75.00',
    }),
  },
  {
    name: 'class-enrollment',
    html: buildClassEnrollmentConfirmationHtml({
      eventName: 'Belly Dance Basics',
      customerName: 'Jane',
      sessionLabel: 'Mon Jun 9, 6:00 PM',
      amount: '$35.00',
      confirmationReference: 'CLS-001',
    }),
  },
  {
    name: 'class-bundle',
    html: buildClassBundleConfirmationHtml({
      eventName: 'Summer Intensive',
      customerName: 'Jane',
      dateLabel: 'June 9, 2026',
      totalAmount: '$90.00',
      lines: [
        {
          sessionLabel: 'Morning session',
          amount: '$45.00',
          confirmationReference: 'CLS-001',
        },
        {
          sessionLabel: 'Afternoon session',
          amount: '$45.00',
          confirmationReference: 'CLS-002',
        },
      ],
    }),
  },
];

mkdirSync(OUT_DIR, { recursive: true });

const indexLinks: string[] = [
  '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Email previews</title></head><body><h1>Shamell email previews</h1><ul>',
];

for (const { name, html } of previews) {
  const file = `${name}.html`;
  writeFileSync(join(OUT_DIR, file), html, 'utf8');
  indexLinks.push(`<li><a href="${file}">${name}</a></li>`);
}

indexLinks.push('</ul></body></html>');
writeFileSync(join(OUT_DIR, 'index.html'), indexLinks.join('\n'), 'utf8');

console.log(`Wrote ${previews.length} previews to ${OUT_DIR}`);
