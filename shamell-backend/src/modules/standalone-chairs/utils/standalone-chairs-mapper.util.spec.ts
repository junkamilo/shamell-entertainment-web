import {
  makeChairRow,
  makeLayoutChairItem,
} from '../__mocks__/standalone-chairs.fixtures';
import {
  collectPlacedStandaloneChairIds,
  decimalToNumber,
  mapChairRow,
  mapPublicChairListItem,
  parseLayoutItems,
} from './standalone-chairs-mapper.util';

describe('standalone-chairs-mapper.util', () => {
  it('decimalToNumber and mapChairRow', () => {
    expect(decimalToNumber(25)).toBe(25);
    const mapped = mapChairRow(makeChairRow());
    expect(mapped.displayLabel).toBe('Chair');
    expect(mapped.unitPrice).toBe(25);
  });

  it('mapPublicChairListItem', () => {
    const item = mapPublicChairListItem(makeChairRow());
    expect(item.isActive).toBe(true);
    expect(item.unitPrice).toBe(25);
  });

  it('parseLayoutItems and collect placed ids', () => {
    const items = parseLayoutItems([makeLayoutChairItem()] as never);
    expect(items).toHaveLength(1);
    expect(
      collectPlacedStandaloneChairIds([makeLayoutChairItem()] as never).has(
        'chair-1',
      ),
    ).toBe(true);
    expect(parseLayoutItems(null)).toEqual([]);
  });
});
