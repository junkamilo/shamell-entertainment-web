import {
  buildFixedTicketConfirmationHtml,
  buildFixedTicketConfirmationText,
  packageSnapshotFromEnrollment,
} from './fixed-ticket-confirmation.mail';
import {
  buildFixedTicketAdminContextLabel,
  buildFixedTicketAdminDetailsLines,
  fixedTicketNotifyFieldsFromEnrollment,
  fixedTicketVerificationCode,
} from './fixed-ticket-notify.util';

describe('fixed-ticket verification + confirmation mail', () => {
  const enrollmentId = 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';

  it('normalizes verification code to lowercase UUID', () => {
    expect(fixedTicketVerificationCode(enrollmentId)).toBe(
      enrollmentId.toLowerCase(),
    );
  });

  it('customer text includes package, includes list, and verification UUID', () => {
    const text = buildFixedTicketConfirmationText({
      eventName: 'Rhythm Night',
      customerName: 'Ana Perez',
      ticketNumber: 7,
      eventDateLabel: 'Saturday gala',
      amount: '85.00 USD',
      verificationCode: enrollmentId,
      package: {
        packageTitle: 'VIP Early Entry',
        packageArrivalLabel: '7:00 PM – 8:00 PM',
        packageInclusions: [{ title: 'Workshop' }, { title: 'Show' }],
      },
    });

    expect(text).toContain(enrollmentId.toLowerCase());
    expect(text).toContain('Package: VIP Early Entry');
    expect(text).toContain('Arrival window: 7:00 PM – 8:00 PM');
    expect(text).toContain('• Workshop');
    expect(text).toContain('• Show');
    expect(text).toContain('Your ticket number: #7');
  });

  it('customer html highlights verification code and package includes', () => {
    const html = buildFixedTicketConfirmationHtml({
      eventName: 'Rhythm Night',
      customerName: 'Ana Perez',
      ticketNumber: 7,
      eventDateLabel: 'Saturday gala',
      amount: '85.00 USD',
      verificationCode: enrollmentId,
      package: {
        packageTitle: 'VIP Early Entry',
        packageArrivalLabel: '7:00 PM',
        packageInclusions: [{ title: 'Workshop' }],
      },
    });

    expect(html).toContain(enrollmentId.toLowerCase());
    expect(html).toContain('Verification code');
    expect(html).toContain('VIP Early Entry');
    expect(html).toContain('Workshop');
  });

  it('admin notify fields share the same UUID and buyer/package details', () => {
    const fields = fixedTicketNotifyFieldsFromEnrollment(
      {
        id: enrollmentId,
        customerName: 'Ana Perez',
        customerEmail: 'ana@example.com',
        customerPhone: '+1 555 0100',
        amount: 85,
        currency: 'usd',
        ticketNumber: 7,
        packageTitle: 'VIP Early Entry',
        packageArrivalLabel: '7:00 PM',
        packageInclusions: [{ title: 'Workshop' }, { title: 'Show' }],
        event: { eventType: { name: 'Rhythm Night' } },
      },
      'Saturday gala',
    );

    expect(fields.reference).toBe(enrollmentId.toLowerCase());
    expect(fields.customerName).toBe('Ana Perez');
    expect(fields.customerEmail).toBe('ana@example.com');
    expect(fields.customerPhone).toBe('+1 555 0100');
    expect(fields.contextLabel).toContain('VIP Early Entry');
    expect(fields.contextLabel).toContain('Ticket #7');
    expect(fields.detailsLines).toEqual(
      expect.arrayContaining([
        'Ticket #: 7',
        'Package: VIP Early Entry',
        'Arrival: 7:00 PM',
        'Includes: Workshop, Show',
        'Event: Saturday gala',
      ]),
    );
  });

  it('packageSnapshotFromEnrollment ignores empty package titles', () => {
    expect(packageSnapshotFromEnrollment({ packageTitle: '  ' })).toBeNull();
    expect(
      packageSnapshotFromEnrollment({
        packageTitle: 'VIP',
        packageInclusions: [{ title: 'Show' }],
      }),
    ).toEqual({
      packageTitle: 'VIP',
      packageArrivalLabel: undefined,
      packageInclusions: [{ title: 'Show' }],
    });
  });

  it('builds admin context and detail helpers', () => {
    expect(
      buildFixedTicketAdminContextLabel({
        eventName: 'Gala',
        packageTitle: 'Early',
        ticketNumber: 3,
      }),
    ).toBe('Gala — Package: Early — Ticket #3');

    expect(
      buildFixedTicketAdminDetailsLines({
        package: {
          packageTitle: 'Early',
          packageInclusions: [{ title: 'Show' }],
        },
      }),
    ).toEqual(['Package: Early', 'Includes: Show']);
  });
});
