/**
 * Generate static HTML previews for all transactional email templates.
 * Usage: npx ts-node scripts/preview-email-templates.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  buildAdminCustomerActivityHtml,
  type AdminCustomerActivityKind,
} from '../src/modules/mail/admin-customer-activity.mail';
import { buildAdminInviteEmailHtml } from '../src/modules/mail/admin-invite.mail';
import {
  buildAdminPaymentOutcomeHtml,
  type AdminPaymentOutcome,
} from '../src/modules/mail/admin-payment.mail';
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
import { buildVenueReservationPaymentRequestHtml } from '../src/modules/venue-reservations/venue-reservation-payment-request.mail';

const OUT_DIR = join(process.cwd(), 'tmp', 'email-previews');
const SITE = 'https://shamellentertainment.com';

const previews: { name: string; html: string }[] = [];

const adminPaymentOutcomes: AdminPaymentOutcome[] = [
  'PAID',
  'DEPOSIT_PAID',
  'EXPIRED',
  'CANCELLED',
];
for (const outcome of adminPaymentOutcomes) {
  previews.push({
    name: `admin-payment-${outcome.toLowerCase()}`,
    html: buildAdminPaymentOutcomeHtml({
      appPublicName: 'Shamell',
      frontendBaseUrl: SITE,
      outcome,
      flowLabel: outcome === 'PAID' ? 'Venue seat' : 'Booking',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      amountUsd: '$2,500.00',
      contextLabel: 'Private gala',
      reference: '5e825440',
      stageLabel: outcome === 'DEPOSIT_PAID' ? 'Deposit' : 'Full payment',
    }),
  });
}

const adminActivityKinds: AdminCustomerActivityKind[] = [
  'CONCIERGE_INQUIRY',
  'BOOKING_INQUIRY',
  'BOOKING_CONFIRMED',
  'BOOKING_QUOTE_SENT',
  'BOOKING_BALANCE_LINK_SENT',
];
for (const kind of adminActivityKinds) {
  previews.push({
    name: `admin-customer-activity-${kind.toLowerCase().replace(/_/g, '-')}`,
    html: buildAdminCustomerActivityHtml({
      appPublicName: 'Shamell',
      frontendBaseUrl: SITE,
      kind,
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      contextLabel: 'Luxury birthday',
      amountUsd: '$2,500.00',
      reference: '5e825440',
    }),
  });
}

previews.push(
  {
    name: 'admin-invite',
    html: buildAdminInviteEmailHtml({
      appName: 'Shamell Admin',
      fullName: 'New Admin',
      code: '123456',
      branding: { siteBaseUrl: SITE },
    }),
  },
  {
    name: 'booking-quote',
    html: buildBookingQuoteHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      frontendBaseUrl: SITE,
      bookingReference: 'REF-001',
      totalAmountUsd: '$2,500.00',
      depositAmountUsd: '$1,000.00',
      payUrl: `${SITE}/pay/quote?token=example`,
    }),
  },
  {
    name: 'booking-deposit-paid',
    html: buildBookingDepositPaidHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      frontendBaseUrl: SITE,
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
      frontendBaseUrl: SITE,
      bookingReference: 'REF-001',
      amountUsd: '$2,500.00',
    }),
  },
  {
    name: 'booking-balance-link',
    html: buildBookingBalanceLinkHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      frontendBaseUrl: SITE,
      bookingReference: 'REF-001',
      totalAmountUsd: '$1,500.00',
      payUrl: `${SITE}/pay/quote?token=balance`,
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
      frontendBaseUrl: SITE,
    }),
  },
  {
    name: 'venue-reservation-payment-request',
    html: buildVenueReservationPaymentRequestHtml({
      recipientName: 'Michael',
      appPublicName: 'Shamell Entertainment',
      frontendBaseUrl: SITE,
      reservationReference: '3C1EAB64',
      eventLabel: 'BELLY DANCE PASION SHOW',
      seatLabel: 'Medium table 6',
      amountUsd: '$40.00',
      payUrl: `${SITE}/pay/venue-seat?token=example`,
    }),
  },
  {
    name: 'venue-reservation-confirmation',
    html: buildVenueReservationConfirmationHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      frontendBaseUrl: SITE,
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
      branding: { siteBaseUrl: SITE },
      guideInvestment: { totalUsd: 2500, isPartial: false },
    }),
  },
  {
    name: 'concierge-inquiry-ack',
    html: buildConciergeInquiryAckHtml({
      recipientFirstName: 'Jane',
      appPublicName: 'Shamell',
      branding: { siteBaseUrl: SITE },
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
      branding: { siteBaseUrl: SITE },
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
      branding: { siteBaseUrl: SITE },
    }),
  },
  {
    name: 'class-bundle',
    html: buildClassBundleConfirmationHtml({
      eventName: 'Summer Intensive',
      customerName: 'Jane',
      dateLabel: 'June 9, 2026',
      totalAmount: '$90.00',
      branding: { siteBaseUrl: SITE },
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
);

mkdirSync(OUT_DIR, { recursive: true });

const indexLinks: string[] = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="utf-8"/>',
  '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
  '<title>Shamell email previews</title>',
  '<style>body{font-family:system-ui,sans-serif;padding:16px;} li{margin:8px 0;}</style>',
  '</head>',
  '<body>',
  '<h1>Shamell email previews</h1>',
  '<p>Open on a phone or use DevTools device mode to verify full scroll and visible CTAs.</p>',
  '<ul>',
];

for (const { name, html } of previews) {
  const file = `${name}.html`;
  writeFileSync(join(OUT_DIR, file), html, 'utf8');
  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  indexLinks.push(`<li><a href="${file}">${name}</a> <small>(${kb} KB)</small></li>`);
}

indexLinks.push('</ul>', '</body>', '</html>');
writeFileSync(join(OUT_DIR, 'index.html'), indexLinks.join('\n'), 'utf8');

console.log(`Wrote ${previews.length} previews to ${OUT_DIR}`);
