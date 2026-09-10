import { BadRequestException } from '@nestjs/common';
import { makeCreateContactDto } from '../__mocks__/contact.fixtures';
import { assertConciergeGatePayload } from './assert-concierge-gate-payload';

function conciergeDto(
  overrides: Parameters<typeof makeCreateContactDto>[0] = {},
) {
  const { inquiryDetails, ...rest } = overrides;
  return makeCreateContactDto({
    phone: '+15551234567',
    location: 'Miami',
    eventDate: '2030-08-01',
    inquiryDetails: {
      entrySource: 'concierge_gate',
      guestCount: 12,
      planningStage: 'EARLY_IDEA',
      ...(inquiryDetails ?? {}),
    },
    ...rest,
  });
}

describe('assertConciergeGatePayload', () => {
  it('allows a complete concierge payload', () => {
    expect(() => assertConciergeGatePayload(conciergeDto())).not.toThrow();
  });

  it('does not require concierge fields for other entry sources', () => {
    expect(() =>
      assertConciergeGatePayload(
        makeCreateContactDto({
          phone: undefined,
          location: undefined,
          eventDate: undefined,
          inquiryDetails: { entrySource: 'contact_page' },
        }),
      ),
    ).not.toThrow();
  });

  it('rejects missing phone, location, date, guests, and planning stage', () => {
    expect(() =>
      assertConciergeGatePayload(conciergeDto({ phone: '' })),
    ).toThrow(BadRequestException);
    expect(() =>
      assertConciergeGatePayload(conciergeDto({ phone: '' })),
    ).toThrow('Phone is required.');

    expect(() =>
      assertConciergeGatePayload(conciergeDto({ location: 'M' })),
    ).toThrow('City or event location is required.');

    expect(() =>
      assertConciergeGatePayload(conciergeDto({ eventDate: '' })),
    ).toThrow('Tentative date is required.');

    expect(() =>
      assertConciergeGatePayload(
        conciergeDto({ inquiryDetails: { guestCount: 0 } }),
      ),
    ).toThrow('Approximate guest count is required.');

    expect(() =>
      assertConciergeGatePayload(
        conciergeDto({ inquiryDetails: { planningStage: 'nope' } }),
      ),
    ).toThrow('Planning stage is required.');
  });

  it('rejects a short phone', () => {
    expect(() =>
      assertConciergeGatePayload(conciergeDto({ phone: '123' })),
    ).toThrow('Enter a valid phone number (7+ digits).');
  });
});
