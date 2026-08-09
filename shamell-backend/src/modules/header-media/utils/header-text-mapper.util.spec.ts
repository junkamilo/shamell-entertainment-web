import { DEFAULT_HEADER_TEXT } from '../constants/header-media.constants';
import { makeHeroHeaderContent } from '../__mocks__/header-media.fixtures';
import { mapAdminHeaderText, mapHeaderText } from './header-text-mapper.util';

describe('header-text-mapper.util', () => {
  it('returns defaults when row is null', () => {
    expect(mapHeaderText(null)).toEqual({
      ...DEFAULT_HEADER_TEXT,
      isActive: true,
      updatedAt: null,
    });
  });

  it('maps row fields and ISO updatedAt', () => {
    const row = makeHeroHeaderContent({ headline: 'Custom' });
    const mapped = mapHeaderText(row);
    expect(mapped.headline).toBe('Custom');
    expect(mapped.updatedAt).toBe(row.updatedAt.toISOString());
  });

  it('mapAdminHeaderText returns null for missing row', () => {
    expect(mapAdminHeaderText(null)).toBeNull();
  });

  it('mapAdminHeaderText includes id', () => {
    const row = makeHeroHeaderContent();
    expect(mapAdminHeaderText(row)).toMatchObject({
      id: row.id,
      headline: DEFAULT_HEADER_TEXT.headline,
    });
  });
});
