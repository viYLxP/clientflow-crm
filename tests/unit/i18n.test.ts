import { describe, expect, it } from 'vitest';
import { ar } from '../../src/i18n/ar';
import { interpolate } from '../../src/i18n/config';
import { en } from '../../src/i18n/en';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('dictionaries', () => {
  it('Arabic has exactly the same keys as English', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it('no translation is empty', () => {
    for (const [key, value] of [...Object.entries(en), ...Object.entries(ar)]) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('Arabic uses the same {placeholders} as English for every key', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(ar[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it('user-facing Arabic strings contain Arabic script (catches copy-pasted English)', () => {
    const exempt = new Set(['app.name', 'lang.en', 'detail.charCount', 'footer.copyright']);
    for (const [key, value] of Object.entries(ar)) {
      if (exempt.has(key)) continue;
      expect(/[؀-ۿ]/.test(value), key).toBe(true);
    }
  });
});

describe('interpolate', () => {
  it('replaces known params and leaves unknown ones visible', () => {
    expect(interpolate('Hi {name}, {missing}', { name: 'Sara' })).toBe('Hi Sara, {missing}');
  });
});
