import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { TranslationKey } from './en';
import {
  LANGUAGE_STORAGE_KEY,
  detectInitialLanguage,
  dictionaries,
  directions,
  interpolate,
  intlLocales,
  type Language,
  type TranslateParams,
} from './config';

export interface I18nValue {
  language: Language;
  dir: 'ltr' | 'rtl';
  locale: string;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: TranslateParams) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
  formatDate: (iso: string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelative: (iso: string) => string;
}

export const LanguageContext = createContext<I18nValue | null>(null);

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  const dir = directions[language];
  const locale = intlLocales[language];

  // Keep <html lang/dir> and the document title in sync, and persist the choice.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = dir;
    document.title = `${dictionaries[language]['app.name']} · ${dictionaries[language]['app.tagline']}`;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Not fatal: the language still works for this session.
    }
  }, [language, dir]);

  const setLanguage = useCallback((next: Language) => setLanguageState(next), []);
  const toggleLanguage = useCallback(
    () => setLanguageState((current) => (current === 'en' ? 'ar' : 'en')),
    [],
  );

  const value = useMemo<I18nValue>(() => {
    const dictionary = dictionaries[language];
    const numberFormat = new Intl.NumberFormat(locale);
    const currencyFormat = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    });
    const percentFormat = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
    const relativeFormat = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    return {
      language,
      dir,
      locale,
      setLanguage,
      toggleLanguage,
      t: (key, params) => interpolate(dictionary[key] ?? dictionaries.en[key] ?? key, params),
      formatNumber: (n, options) =>
        options ? new Intl.NumberFormat(locale, options).format(n) : numberFormat.format(n),
      formatCurrency: (n) => currencyFormat.format(n),
      formatPercent: (n) => percentFormat.format(n),
      formatDate: (iso, options = { dateStyle: 'medium' }) =>
        new Intl.DateTimeFormat(locale, options).format(new Date(iso)),
      formatRelative: (iso) => {
        const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
        for (const [unit, size] of RELATIVE_UNITS) {
          if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
        }
        return relativeFormat.format(0, 'second');
      },
    };
  }, [language, dir, locale, setLanguage, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
