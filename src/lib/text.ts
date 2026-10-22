const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/** Converts Arabic-Indic and Persian digits to Latin digits so users can type with either keyboard. */
export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const index = ARABIC_INDIC.indexOf(digit);
    return String(index >= 0 ? index : EASTERN_ARABIC_INDIC.indexOf(digit));
  });
}

/**
 * Normalizes text for search: case-insensitive, ignores Arabic diacritics and
 * tatweel, unifies common letter variants (أ/إ/آ → ا, ة → ه, ى → ي) and digits.
 */
export function normalizeForSearch(value: string): string {
  return toLatinDigits(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // randomUUID requires a secure context; this fallback covers plain-HTTP LAN testing.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}
