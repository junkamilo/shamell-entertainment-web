import {
  buildClassBundleConfirmationSubject,
  buildClassBundleConfirmationText,
} from './class-bundle-confirmation.mail';

describe('class-bundle-confirmation.mail', () => {
  it('builds subject for multiple classes', () => {
    expect(buildClassBundleConfirmationSubject('Dance Shamell', 3)).toContain(
      '3 classes',
    );
  });

  it('includes confirmation codes in text body', () => {
    const text = buildClassBundleConfirmationText({
      eventName: 'Dance Shamell',
      customerName: 'Alex',
      dateLabel: '2026-06-04',
      totalAmount: '$40.00 USD',
      lines: [
        {
          sessionLabel: 'Thu 6pm — Section A',
          amount: '$20.00 USD',
          confirmationReference: 'A1B2C3D4',
        },
      ],
      siteBaseUrl: 'https://example.com',
    });
    expect(text).toContain('Confirmation #A1B2C3D4');
    expect(text).toContain('check-in');
  });
});
