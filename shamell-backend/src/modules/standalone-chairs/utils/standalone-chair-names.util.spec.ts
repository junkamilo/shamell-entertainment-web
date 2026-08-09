import {
  STANDALONE_CHAIR_DISPLAY_LABEL,
  buildTechnicalChairName,
  generateTechnicalChairNameEntries,
} from './standalone-chair-names.util';

describe('standalone-chair-names.util', () => {
  it('exposes display label', () => {
    expect(STANDALONE_CHAIR_DISPLAY_LABEL).toBe('Chair');
  });

  it('builds technical chair name from uuid', () => {
    expect(
      buildTechnicalChairName('abcd1234-5678-90ab-cdef-111111111111'),
    ).toBe('CHAIR-abcd1234');
  });

  it('generates unique technical name entries', () => {
    const entries = generateTechnicalChairNameEntries(3);
    expect(entries).toHaveLength(3);
    expect(new Set(entries.map((e) => e.id)).size).toBe(3);
    expect(entries[0].chairName).toMatch(/^CHAIR-/);
  });
});
