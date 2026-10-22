import { useI18n } from '../i18n';
import { Icon } from './Icon';

/**
 * Toggles between English and Arabic. The visible label is the *target* language,
 * written in that language and marked with its own lang attribute for screen readers.
 */
export function LanguageSwitcher() {
  const { language, toggleLanguage, t } = useI18n();
  const target = language === 'en' ? 'ar' : 'en';
  const targetName = t(`lang.${target}`);

  return (
    <button
      type="button"
      className="btn btn--ghost lang-switch"
      onClick={toggleLanguage}
      aria-label={t('lang.switchTo', { language: targetName })}
      title={t('lang.switchTo', { language: targetName })}
      data-testid="language-switcher"
    >
      <Icon name="globe" />
      <span lang={target} dir={target === 'ar' ? 'rtl' : 'ltr'}>
        {targetName}
      </span>
    </button>
  );
}
