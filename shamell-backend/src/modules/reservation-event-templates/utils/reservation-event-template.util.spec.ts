import { BadRequestException } from '@nestjs/common';
import { ReservationEventScheduleMode } from '@prisma/client';
import {
  makeFixedCreateDto,
  makeRecurringCreateDto,
  makeWeekdays,
} from '../__mocks__/reservation-event-templates.fixtures';
import { MIN_CLASS_SECTION_PRICE } from '../constants/reservation-event-templates.constants';
import {
  buildTemplateSummary,
  deriveVenueConfigFromTemplate,
  parseHHMM,
  parseISODateOnly,
  validateTemplatePayload,
} from './reservation-event-template.util';

describe('reservation-event-template.util', () => {
  describe('parseHHMM', () => {
    it('parses valid times', () => {
      expect(parseHHMM('19:30', 't')).toEqual({ h: 19, m: 30 });
    });

    it('rejects invalid format', () => {
      expect(() => parseHHMM('9:00', 't')).toThrow(BadRequestException);
    });
  });

  describe('parseISODateOnly', () => {
    it('parses YYYY-MM-DD', () => {
      expect(
        parseISODateOnly('2026-09-01', 'd').toISOString().slice(0, 10),
      ).toBe('2026-09-01');
    });

    it('rejects bad dates', () => {
      expect(() => parseISODateOnly('09-01-2026', 'd')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateTemplatePayload', () => {
    it('validates fixed events', () => {
      const result = validateTemplatePayload(makeFixedCreateDto());
      expect(result.scheduleMode).toBe(
        ReservationEventScheduleMode.FIXED_EVENT,
      );
      expect(result.eventStartTime).toBe('19:00');
      expect(result.classSections).toEqual([]);
    });

    it('rejects fixed event with end before start', () => {
      expect(() =>
        validateTemplatePayload(makeFixedCreateDto({ eventEndTime: '18:00' })),
      ).toThrow(BadRequestException);
    });

    it('validates recurring with class sections', () => {
      const result = validateTemplatePayload(makeRecurringCreateDto());
      expect(result.scheduleMode).toBe(
        ReservationEventScheduleMode.RECURRING_WEEKLY,
      );
      expect(result.classSections).toHaveLength(1);
      expect(result.classSections[0].label).toBe('Beginner');
    });

    it('rejects recurring section price below minimum', () => {
      expect(() =>
        validateTemplatePayload(
          makeRecurringCreateDto({
            classSections: [
              {
                weekday: 1,
                label: 'Beginner',
                startTime: '18:00',
                endTime: '19:00',
                sortOrder: 0,
                defaultCapacity: 12,
                defaultPrice: MIN_CLASS_SECTION_PRICE - 0.1,
                isActive: true,
              },
            ],
          }),
        ),
      ).toThrow(BadRequestException);
    });

    it('rejects active weekday without sections', () => {
      expect(() =>
        validateTemplatePayload(
          makeRecurringCreateDto({
            weekdays: makeWeekdays([1, 2]),
            classSections: [
              {
                weekday: 1,
                label: 'Beginner',
                startTime: '18:00',
                endTime: '19:00',
                sortOrder: 0,
                defaultCapacity: 12,
                defaultPrice: 25,
                isActive: true,
              },
            ],
          }),
        ),
      ).toThrow(/Tue is active but has no class sections/);
    });
  });

  describe('deriveVenueConfigFromTemplate', () => {
    it('derives fixed event window', () => {
      const derived = deriveVenueConfigFromTemplate({
        name: 'Gala Night',
        timezone: 'America/New_York',
        scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
        salesStartDate: new Date('2026-09-01T12:00:00.000Z'),
        salesEndDate: new Date('2026-09-20T12:00:00.000Z'),
        eventDate: new Date('2026-09-25T12:00:00.000Z'),
        eventStartTime: '19:00',
        eventEndTime: '22:00',
        recurringEffectiveFrom: null,
        recurringStartTime: null,
        recurringEndTime: null,
      });
      expect(derived.reservationEventLabel).toBe('Gala Night');
      expect(derived.reservationOpensAt.getTime()).toBeLessThan(
        derived.reservationClosesAt.getTime(),
      );
    });
  });

  describe('buildTemplateSummary', () => {
    it('summarizes fixed events', () => {
      const summary = buildTemplateSummary({
        name: 'Gala Night',
        timezone: 'America/New_York',
        scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
        salesStartDate: new Date('2026-09-01T12:00:00.000Z'),
        salesEndDate: new Date('2026-09-20T12:00:00.000Z'),
        eventDate: new Date('2026-09-25T12:00:00.000Z'),
        eventStartTime: '19:00',
        eventEndTime: '22:00',
        recurringEffectiveFrom: null,
        recurringStartTime: null,
        recurringEndTime: null,
      });
      expect(summary).toContain('Sales 2026-09-01–2026-09-20');
      expect(summary).toContain('Event 2026-09-25');
    });

    it('summarizes recurring with active days', () => {
      const summary = buildTemplateSummary({
        name: 'Weekly',
        timezone: 'America/New_York',
        scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
        salesStartDate: null,
        salesEndDate: null,
        eventDate: null,
        eventStartTime: null,
        eventEndTime: null,
        recurringEffectiveFrom: new Date('2026-08-09T12:00:00.000Z'),
        recurringStartTime: '18:00',
        recurringEndTime: '19:00',
        weekdays: makeWeekdays([1]).map((w) => ({
          id: `wd-${w.weekday}`,
          templateId: 't',
          weekday: w.weekday,
          isActive: w.isActive,
        })),
      });
      expect(summary).toContain('Mon');
      expect(summary).toContain('18:00–19:00');
    });
  });
});
