import { buildAdminPaymentOutcomeHtml } from './admin-payment.mail';
import {
  buildBookingQuoteHtml,
  buildBookingBalanceLinkHtml,
} from '../bookings/booking-quote.mail';
import {
  buildEmailDocumentOpen,
  buildEmailSimpleCardBody,
  buildPaymentActionEmail,
} from './email-html-layout';
import { EMAIL_TOKENS_LIGHT } from './email-html-tokens';
import { buildVenueReservationPaymentRequestHtml } from '../venue-reservations/venue-reservation-payment-request.mail';

describe('email-html-layout', () => {
  it('includes color-scheme meta and dark mode media query', () => {
    const doc = buildEmailDocumentOpen('Test');
    expect(doc).toContain('color-scheme');
    expect(doc).toContain('light dark');
    expect(doc).toContain('@media (prefers-color-scheme: dark)');
    expect(doc).toContain('email-body');
    expect(doc).toContain('height: auto !important');
  });

  it('card layout does not clip content with overflow hidden', () => {
    const html = buildEmailSimpleCardBody('<p>Body</p>');
    expect(html).not.toMatch(/class="email-card"[^>]*overflow:\s*hidden/);
    expect(html).not.toMatch(
      /class="email-card-section"[^>]*overflow:\s*hidden/,
    );
  });

  it('admin payment html uses light fallback background', () => {
    const html = buildAdminPaymentOutcomeHtml({
      appPublicName: 'Shamell',
      outcome: 'PAID',
      flowLabel: 'Booking',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      amountUsd: '$100.00',
      contextLabel: 'Private gala',
    });
    expect(html).toContain('class="email-body"');
    expect(html).toContain(EMAIL_TOKENS_LIGHT.bodyBg);
    expect(html).not.toMatch(/background:#0f0818[^0-9]/);
  });

  it('booking quote html uses shared layout classes', () => {
    const html = buildBookingQuoteHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      bookingReference: 'REF-1',
      totalAmountUsd: '$2500.00',
      payUrl: 'https://pay.example.com',
      frontendBaseUrl: 'https://shamellentertainment.com',
    });
    expect(html).toContain('class="email-card"');
    expect(html).toContain(EMAIL_TOKENS_LIGHT.bodyBg);
    expect(html).toContain('Pay now');
    expect(html.indexOf('Pay now')).toBeLessThan(
      html.indexOf('Booking reference'),
    );
  });

  it('venue payment request places CTA before booking reference', () => {
    const html = buildVenueReservationPaymentRequestHtml({
      recipientName: 'Jane Guest',
      appPublicName: 'Shamell Entertainment',
      frontendBaseUrl: 'https://shamellentertainment.com',
      reservationReference: 'ABCD1234',
      eventLabel: 'Summer Gala',
      seatLabel: 'Medium table 6',
      amountUsd: '$40.00',
      payUrl: 'https://shamellentertainment.com/pay/venue-seat?token=abc',
    });
    expect(html.indexOf('Pay now')).toBeLessThan(
      html.indexOf('Booking reference'),
    );
    expect(html).toContain('Or copy this link:');
    expect(html).not.toMatch(/class="email-card"[^>]*overflow:\s*hidden/);
  });

  it('payment action email stays under Gmail clip threshold with hosted logo', () => {
    const html = buildPaymentActionEmail({
      preheader: 'Complete your payment — Pay now inside',
      logoBlock:
        '<img src="https://shamellentertainment.com/01_bailarina.png" width="140" height="141" alt="Shamell" />',
      heading: 'Complete your payment',
      greeting: 'Hi Jane,',
      introParagraph: 'Please complete your payment.',
      amountUsd: '$40.00',
      cta: { label: 'Pay now', href: 'https://example.com/pay' },
      detailLines: [{ label: 'Reference', value: 'REF-1' }],
    });
    expect(Buffer.byteLength(html, 'utf8')).toBeLessThan(90 * 1024);
  });

  it('balance link email includes full-width CTA', () => {
    const html = buildBookingBalanceLinkHtml({
      recipientName: 'Jane',
      appPublicName: 'Shamell',
      bookingReference: 'REF-1',
      totalAmountUsd: '$1,500.00',
      payUrl: 'https://pay.example.com',
      frontendBaseUrl: 'https://shamellentertainment.com',
    });
    expect(html).toContain('display:block;width:100%');
    expect(html).toContain('Pay balance now');
  });
});
