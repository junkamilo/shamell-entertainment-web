import { PRIVATE_CLASS_DETAILS_KIND } from '../constants/bookings.constants';
import { buildPrivateClassDetails } from './private-class-details.util';

describe('private-class-details.util', () => {
  it('builds details with end = start + 1h', () => {
    const details = buildPrivateClassDetails(
      {
        customerName: 'Ada',
        customerEmail: 'ada@example.com',
        eventDate: '2026-07-15',
        eventTimeStart: '14:00',
        location: 'Studio',
        classType: 'Salsa',
        amountUsd: 120,
      },
      'cash',
    );
    expect(details.kind).toBe(PRIVATE_CLASS_DETAILS_KIND);
    expect(details.eventTimeStart).toBe('14:00');
    expect(details.eventTimeEnd).toBe('15:00');
    expect(details.paymentMethod).toBe('cash');
    expect(details.amountUsd).toBe(120);
  });

  it('rejects amount under 1', () => {
    expect(() =>
      buildPrivateClassDetails(
        {
          customerName: 'Ada',
          customerEmail: 'ada@example.com',
          eventDate: '2026-07-15',
          eventTimeStart: '14:00',
          location: 'Studio',
          classType: 'Salsa',
          amountUsd: 0.5,
        },
        'stripe',
      ),
    ).toThrow(/at least 1/);
  });
});
