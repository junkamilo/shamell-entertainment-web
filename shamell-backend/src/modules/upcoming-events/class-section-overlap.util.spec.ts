import { validateSectionsNoOverlapMessage } from './class-section-overlap.util';

describe('validateSectionsNoOverlapMessage', () => {
  it('allows adjacent non-overlapping slots', () => {
    expect(
      validateSectionsNoOverlapMessage([
        { startTime: '06:00', endTime: '07:00' },
        { startTime: '08:00', endTime: '09:00' },
      ]),
    ).toBeNull();
  });

  it('rejects overlapping slots', () => {
    expect(
      validateSectionsNoOverlapMessage([
        { startTime: '06:00', endTime: '07:00' },
        { startTime: '06:30', endTime: '08:00' },
      ]),
    ).toMatch(/overlaps/i);
  });

  it('rejects end before start', () => {
    expect(
      validateSectionsNoOverlapMessage([
        { startTime: '10:00', endTime: '09:00' },
      ]),
    ).toMatch(/after start/i);
  });
});
