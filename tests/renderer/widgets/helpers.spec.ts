/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { formatStatValue, getJsonPath, thresholdColor } from '@/widgets/helpers';

describe('thresholdColor()', () => {
  it('should return ok when no thresholds are set', () => {
    expect(thresholdColor(1000, {})).toBe('ok');
  })

  it('should map values against warn/crit in normal direction (higher is worse)', () => {
    const thresholds = { warn: 70, crit: 90 };
    expect(thresholdColor(50, thresholds)).toBe('ok');
    expect(thresholdColor(70, thresholds)).toBe('warn');
    expect(thresholdColor(89.9, thresholds)).toBe('warn');
    expect(thresholdColor(90, thresholds)).toBe('crit');
    expect(thresholdColor(150, thresholds)).toBe('crit');
  })

  it('should flip the comparison direction when invert is set (lower is worse)', () => {
    const thresholds = { warn: 30, crit: 10, invert: true };
    expect(thresholdColor(50, thresholds)).toBe('ok');
    expect(thresholdColor(30, thresholds)).toBe('warn');
    expect(thresholdColor(10.1, thresholds)).toBe('warn');
    expect(thresholdColor(10, thresholds)).toBe('crit');
    expect(thresholdColor(0, thresholds)).toBe('crit');
  })

  it('should support warn-only and crit-only thresholds', () => {
    expect(thresholdColor(80, { warn: 70 })).toBe('warn');
    expect(thresholdColor(80, { crit: 70 })).toBe('crit');
    expect(thresholdColor(60, { warn: 70 })).toBe('ok');
  })

  it('should return ok for non-finite values', () => {
    expect(thresholdColor(Number.NaN, { warn: 1, crit: 2 })).toBe('ok');
  })
})

describe('getJsonPath()', () => {
  const obj = {
    data: {
      stats: [
        { cpu: 42.5, name: 'node-1' },
        { cpu: 13, name: 'node-2' },
      ],
      nested: { deep: { value: 'found' } },
      zero: 0,
      isNull: null,
    }
  };

  it('should return the object itself for an empty path', () => {
    expect(getJsonPath(obj, '')).toBe(obj);
    expect(getJsonPath(obj, '  ')).toBe(obj);
  })

  it('should resolve nested dot paths', () => {
    expect(getJsonPath(obj, 'data.nested.deep.value')).toBe('found');
  })

  it('should resolve bracket array indexes mixed with dot segments', () => {
    expect(getJsonPath(obj, 'data.stats[0].cpu')).toBe(42.5);
    expect(getJsonPath(obj, 'data.stats[1].name')).toBe('node-2');
  })

  it('should resolve a leading bracket index on an array root', () => {
    expect(getJsonPath([{ a: 1 }, { a: 2 }], '[1].a')).toBe(2);
  })

  it('should return falsy leaf values as-is', () => {
    expect(getJsonPath(obj, 'data.zero')).toBe(0);
    expect(getJsonPath(obj, 'data.isNull')).toBe(null);
  })

  it('should return undefined for missing segments', () => {
    expect(getJsonPath(obj, 'data.missing')).toBeUndefined();
    expect(getJsonPath(obj, 'data.stats[9].cpu')).toBeUndefined();
    expect(getJsonPath(obj, 'data.stats[0].cpu.deeper')).toBeUndefined();
  })

  it('should return undefined when traversing into a primitive', () => {
    expect(getJsonPath(42, 'a.b')).toBeUndefined();
    expect(getJsonPath(null, 'a')).toBeUndefined();
  })
})

describe('formatStatValue()', () => {
  it('should use 2 decimals below 10, 1 below 100, 0 otherwise', () => {
    expect(formatStatValue(1.2345)).toBe('1.23');
    expect(formatStatValue(42.34)).toBe('42.3');
    expect(formatStatValue(1234.5)).toBe('1235');
    expect(formatStatValue(-5.678)).toBe('-5.68');
  })

  it('should return N/A for non-finite values', () => {
    expect(formatStatValue(Number.NaN)).toBe('N/A');
    expect(formatStatValue(Number.POSITIVE_INFINITY)).toBe('N/A');
  })
})
