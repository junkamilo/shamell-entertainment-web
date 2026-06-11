import { buildAdminPaymentOutcomeHtml } from './admin-payment.mail';
import { buildEmailDocumentOpen } from './email-html-layout';
import { EMAIL_TOKENS_LIGHT } from './email-html-tokens';
import { buildBookingQuoteHtml } from '../bookings/booking-quote.mail';

describe('email-html-layout', () => {
  it('includes color-scheme meta and dark mode media query', () => {
    const doc = buildEmailDocumentOpen('Test');
    expect(doc).toContain('color-scheme');
    expect(doc).toContain('light dark');
    expect(doc).toContain('@media (prefers-color-scheme: dark)');
    expect(doc).toContain('email-body');
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
    });
    expect(html).toContain('class="email-card"');
    expect(html).toContain(EMAIL_TOKENS_LIGHT.bodyBg);
  });
});
