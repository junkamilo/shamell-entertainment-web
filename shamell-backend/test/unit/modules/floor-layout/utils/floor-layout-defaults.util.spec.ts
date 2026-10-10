import { getDefaultLayoutItems } from '@app/modules/floor-layout/utils/floor-layout-defaults.util';

describe('floor-layout-defaults.util', () => {
  it('getDefaultLayoutItems returns an empty array', () => {
    expect(getDefaultLayoutItems()).toEqual([]);
  });
});
