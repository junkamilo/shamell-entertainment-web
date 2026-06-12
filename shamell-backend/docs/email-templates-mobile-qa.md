# Email templates — mobile QA

Transactional emails are built in `src/modules/mail/email-html-layout.ts` and sent via MailerSend (`MailService.sendTransactional`).

## Regenerate HTML previews

```bash
cd shamell-backend
npx ts-node scripts/preview-email-templates.ts
```

Open `tmp/email-previews/index.html` in a browser. Use Chrome DevTools device mode (iPhone / iPad) or send previews to a real device.

## Layout rules (do not regress)

- **Never** add `overflow:hidden` to `.email-card` or `.email-card-section` — iOS Mail clips the bottom of the message.
- Use `sectionRole` on card sections: `top` / `middle` / `bottom` / `solo` for multi-row cards.
- Payment emails must use `buildPaymentActionEmail()` so amount + CTA appear above detail rows.
- Keep hosted logo URLs in production (`FRONTEND_URL` or `EMAIL_LOGO_URL`). Base64 embedded logo is dev/localhost fallback only.
- Re-run `npx ts-node scripts/optimize-email-logo.ts` if the email logo asset changes.

## Environment

| Variable | Purpose |
|----------|---------|
| `FRONTEND_URL` | Public site origin for logo URL and footer links |
| `EMAIL_LOGO_URL` | Optional override for `<img src>` in emails |
| `MAILERSEND_API_KEY` | Required to send live test emails |

## Manual QA checklist (before release)

Send or forward these templates to a **real phone**:

1. **Venue payment request** — `Pay now` visible without scrolling; full message scrolls to footer link.
2. **Booking quote** — same CTA-first layout.
3. **Venue confirmation** — long premium layout, no clipped card bottom.
4. **Admin payment PAID** — ops card with amount highlight fully visible.

Clients to verify:

- iPhone Mail (priority)
- Gmail app (iOS)
- Gmail app (Android)
- iPad Mail

**Pass criteria:** No abrupt cut-off at the card border; payment button or text link visible on first screen for payment emails; entire message scrolls to the end.

## Automated checks

```bash
npm test -- email-html-layout.spec.ts venue-reservation-payment-request.mail.spec.ts
```

Tests assert: no card `overflow:hidden`, CTA before details, HTML size under 90 KB for payment templates with hosted logo.
