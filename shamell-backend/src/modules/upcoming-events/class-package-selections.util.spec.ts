import {
  buildClassMonthPackageSelections,
  buildClassPackageSelections,
  buildClassSessionBundleSelections,
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
