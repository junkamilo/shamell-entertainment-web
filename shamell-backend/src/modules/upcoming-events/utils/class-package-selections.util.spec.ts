import {
  buildClassMonthPackageSelections,
  buildClassPackageSelections,
  buildClassSessionBundleSelections,
  buildClassSessionCartSelections,
} from './class-package-selections.util';

describe('class-package-selections.util', () => {
  it('builds bundle selections payload', () => {
    const json = buildClassSessionBundleSelections({
      dateIso: '2026-06-04',
      sessionIds: ['s1', 's2'],
      items: [
        {
          sessionId: 's1',
          weekday: 4,
          sectionId: 'sec-1',
          amount: 20,
        },
      ],
    });
    expect(json).toMatchObject({
      kind: 'class_session_bundle',
      dateIso: '2026-06-04',
      sessionIds: ['s1', 's2'],
    });
  });

  it('builds cart selections payload', () => {
    const json = buildClassSessionCartSelections({
      sessionIds: ['s1', 's2'],
      items: [
        {
          sessionId: 's1',
          weekday: 2,
          sectionId: 'sec-1',
          dateIso: '2026-08-18',
          amount: 25,
        },
        {
          sessionId: 's2',
          weekday: 3,
          sectionId: 'sec-2',
          dateIso: '2026-08-19',
          amount: 25,
        },
      ],
    });
    expect(json).toMatchObject({
      kind: 'class_session_cart',
      sessionIds: ['s1', 's2'],
    });
    expect((json as { items: unknown[] }).items).toHaveLength(2);
  });

  it('builds package selections payload', () => {
    const json = buildClassPackageSelections({
      sessionIds: ['a'],
      weekdays: [1, 3],
    });
    expect(json).toEqual({
      kind: 'class_package',
      sessionIds: ['a'],
      weekdays: [1, 3],
    });
  });

  it('builds month package selections payload', () => {
    const json = buildClassMonthPackageSelections({
      monthIso: '2026-06',
      sessionIds: ['s1', 's2'],
      items: [
        {
          sessionId: 's1',
          weekday: 1,
          sectionId: 'sec-1',
          amount: 0,
        },
      ],
    });
    expect(json).toMatchObject({
      kind: 'class_month_package',
      monthIso: '2026-06',
      sessionIds: ['s1', 's2'],
      sessionCount: 2,
    });
  });
});
