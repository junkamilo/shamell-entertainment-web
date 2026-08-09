import {
  makeRecurringTemplateRow,
  makeTemplateRow,
} from '../__mocks__/reservation-event-templates.fixtures';
import { mapTemplate } from './reservation-event-template-mapper.util';

describe('reservation-event-template-mapper.util', () => {
  it('maps fixed template dates and linked events', () => {
    const mapped = mapTemplate(
      makeTemplateRow({
        venueConfigs: [{ eventId: 'event-1' }],
      }),
    );
    expect(mapped.salesStartDate).toBe('2026-09-01');
    expect(mapped.eventDate).toBe('2026-09-25');
    expect(mapped.linkedEventIds).toEqual(['event-1']);
    expect(mapped.activeDayLabels).toEqual([]);
    expect(mapped.summary).toContain('Sales');
  });

  it('maps recurring active day labels and section prices', () => {
    const mapped = mapTemplate(makeRecurringTemplateRow());
    expect(mapped.activeDayLabels).toEqual(['Mon']);
    expect(mapped.classSections).toHaveLength(1);
    expect(mapped.classSections[0].defaultPrice).toBe(25);
    expect(mapped.summary).toContain('Mon');
  });
});
