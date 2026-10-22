import { ar } from './ar';
import { en, type Dictionary } from './en';

export const LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';
export const LANGUAGE_STORAGE_KEY = 'clientflow.language';

export const dictionaries: Record<Language, Dictionary> = { en, ar };

export const directions: Record<Language, 'ltr' | 'rtl'> = { en: 'ltr', ar: 'rtl' };

// Locale tags used for Intl formatting. Arabic uses the Gregorian calendar and
// Latin digits, which is the common convention in Saudi business software.
// Change to 'ar-SA' for Hijri dates and Arabic-Indic digits.
export const intlLocales: Record<Language, string> = {
  en: 'en-US',
  ar: 'ar-SA-u-ca-gregory-nu-latn',
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** Saved preference first, then the browser language, then the default. */
export function detectInitialLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); fall through.
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language : '';
  return browser?.toLowerCase().startsWith('ar') ? 'ar' : DEFAULT_LANGUAGE;
}

export type TranslateParams = Record<string, string | number>;

export function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
