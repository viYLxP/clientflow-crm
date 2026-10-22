import { useContext } from 'react';
import { LanguageContext, type I18nValue } from './LanguageContext';

export function useI18n(): I18nValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useI18n must be used inside <LanguageProvider>');
  return context;
}
