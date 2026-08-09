import { BadRequestException } from '@nestjs/common';
import {
  makeSanitizedInquiryDetails,
  makeValidRawInquiryDetails,
} from '../__mocks__/booking-inquiry.fixtures';
import {
  formatInquiryDetailsSummary,
  sanitizeInquiryDetails,
} from './contact-inquiry-details.util';

describe('contact-inquiry-details.util', () => {
  describe('sanitizeInquiryDetails', () => {
    it('returns undefined for null/undefined', () => {
      expect(sanitizeInquiryDetails(undefined)).toBeUndefined();
      expect(sanitizeInquiryDetails(null)).toBeUndefined();
    });

    it('sanitizes a valid payload', () => {
      const out = sanitizeInquiryDetails(makeValidRawInquiryDetails());
      expect(out).toEqual(
        expect.objectContaining({
          entrySource: 'contact_page',
          guestCount: 50,
          experienceAddons: ['FIRE'],
        }),
      );
    });

    it('rejects invalid entrySource', () => {
      expect(() =>
        sanitizeInquiryDetails(
          makeValidRawInquiryDetails({ entrySource: 'not_a_source' }),
        ),
      ).toThrow(BadRequestException);
    });

    it('rejects invalid experienceAddons', () => {
      expect(() =>
        sanitizeInquiryDetails(
          makeValidRawInquiryDetails({ experienceAddons: ['LASERS'] }),
        ),
      ).toThrow(BadRequestException);
    });

    it('rejects non-object payload', () => {
      expect(() => sanitizeInquiryDetails('x')).toThrow(BadRequestException);
    });
  });

  describe('formatInquiryDetailsSummary', () => {
    it('includes key labels in the summary', () => {
      const summary = formatInquiryDetailsSummary(
        makeSanitizedInquiryDetails({
          entrySource: 'home_service_card',
          occasionSingleLabel: 'Wedding',
          guestCount: 80,
          experienceAddons: ['FIRE', 'VEIL_FAN_LED'],
        }),
        'SHOW',
      );
      expect(summary).toContain('Service line: SHOW');
      expect(summary).toContain('Entry: home_service_card');
      expect(summary).toContain('Occasion: Wedding');
      expect(summary).toContain('Guests (approx.): 80');
      expect(summary).toContain('Experience add-ons: FIRE, VEIL_FAN_LED');
    });
  });
});
