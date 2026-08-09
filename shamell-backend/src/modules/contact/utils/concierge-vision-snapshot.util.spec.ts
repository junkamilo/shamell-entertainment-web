import { makeCreateContactDto } from '../__mocks__/contact.fixtures';
import { buildConciergeVisionSnapshot } from './concierge-vision-snapshot.util';

describe('concierge-vision-snapshot.util', () => {
  it('always returns the fixed 9 keys', () => {
    const snapshot = buildConciergeVisionSnapshot(
      makeCreateContactDto({
        inquiryDetails: {
          entrySource: 'concierge_gate',
          occasionHint: ' Wedding ',
          guestCount: 80,
          planningStage: 'exploring',
        },
        eventDate: '2026-09-01',
        phone: ' 555 ',
        location: ' Miami ',
      }),
    );

    expect(Object.keys(snapshot).sort()).toEqual([
      'email',
      'eventDate',
      'fullName',
      'guestCount',
      'location',
      'message',
      'occasionHint',
      'phone',
      'planningStage',
    ]);
    expect(snapshot.occasionHint).toBe('Wedding');
    expect(snapshot.guestCount).toBe(80);
    expect(snapshot.eventDate).toBe('2026-09-01');
    expect(snapshot.phone).toBe('555');
    expect(snapshot.location).toBe('Miami');
  });

  it('omits empty optional fields as empty string / null', () => {
    const snapshot = buildConciergeVisionSnapshot(
      makeCreateContactDto({
        phone: undefined,
        location: undefined,
        eventDate: undefined,
        inquiryDetails: { entrySource: 'concierge_gate' },
      }),
    );

    expect(snapshot.phone).toBe('');
    expect(snapshot.location).toBe('');
    expect(snapshot.eventDate).toBeNull();
    expect(snapshot.guestCount).toBeNull();
    expect(snapshot.occasionHint).toBe('');
    expect(snapshot.planningStage).toBe('');
  });
});
