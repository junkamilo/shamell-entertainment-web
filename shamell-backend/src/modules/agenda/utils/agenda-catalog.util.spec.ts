import { makeServiceCatalogRow } from '../__mocks__/agenda.fixtures';
import { mapCatalogServices } from './agenda-catalog.util';

describe('agenda-catalog.util', () => {
  it('maps serviceType.name to serviceTypeName', () => {
    expect(
      mapCatalogServices([
        makeServiceCatalogRow(),
        makeServiceCatalogRow({
          id: 'svc-2',
          serviceType: { name: 'Live music' },
        }),
      ]),
    ).toEqual([
      { id: 'svc-1', serviceTypeName: 'Dance' },
      { id: 'svc-2', serviceTypeName: 'Live music' },
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(mapCatalogServices([])).toEqual([]);
  });
});
