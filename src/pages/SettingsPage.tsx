import { useRef, useState, type ChangeEvent } from 'react';
import { Icon } from '../components/Icon';
import { ConfirmDialog, PageHeader } from '../components/ui';
import { LANGUAGES, useI18n } from '../i18n';
import { parseCrmData, serializeForExport } from '../lib/storage';
import { useCrm } from '../store/CrmContext';
import { useToast } from '../store/ToastContext';

type Pending = 'reset' | 'clear' | null;

export default function SettingsPage() {
  const { t, language, setLanguage, formatNumber } = useI18n();
  const { customers, activity, replaceAll, loadSampleData, clearAll } = useCrm();
  const { notify } = useToast();
  const [pending, setPending] = useState<Pending>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const noteCount = customers.reduce((sum, c) => sum + c.notes.length, 0);

  const exportData = () => {
    const blob = new Blob([serializeForExport({ customers, activity })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('success', 'toast.exported');
  };

  const importData = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    try {
      const data = parseCrmData(JSON.parse(await file.text()));
      if (!data) throw new Error('invalid');
      replaceAll(data);
      notify('success', 'toast.dataImported', { count: formatNumber(data.customers.length) });
    } catch {
      notify('error', 'toast.importFailed');
    }
  };

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <section className="card settings-section" aria-labelledby="lang-title">
        <h2 id="lang-title" className="card__title">{t('settings.language.title')}</h2>
        <p className="muted">{t('settings.language.body')}</p>
        <fieldset className="segmented">
          <legend className="visually-hidden">{t('lang.label')}</legend>
          {LANGUAGES.map((lang) => (
            <label key={lang} className={`segmented__option${language === lang ? ' segmented__option--active' : ''}`}>
              <input type="radio" name="language" value={lang} checked={language === lang} onChange={() => setLanguage(lang)} />
              <span lang={lang}>{t(`lang.${lang}`)}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="card settings-section" aria-labelledby="data-title">
        <h2 id="data-title" className="card__title">{t('settings.data.title')}</h2>
        <p className="muted">{t('settings.data.body')}</p>
        <p className="settings-summary">
          {t('settings.data.summary', { customers: formatNumber(customers.length), notes: formatNumber(noteCount) })}
        </p>

        <ul className="setting-rows">
          <li className="setting-row">
            <div>
              <p className="setting-row__title">{t('settings.export')}</p>
              <p className="muted small">{t('settings.export.body')}</p>
            </div>
            <button type="button" className="btn btn--secondary" onClick={exportData}>
              <Icon name="download" /> {t('settings.export')}
            </button>
          </li>
          <li className="setting-row">
            <div>
              <p className="setting-row__title">{t('settings.import')}</p>
              <p className="muted small">{t('settings.import.body')}</p>
            </div>
            <button type="button" className="btn btn--secondary" onClick={() => fileInput.current?.click()}>
              <Icon name="upload" /> {t('settings.import')}
            </button>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importData} data-testid="import-input" />
          </li>
        </ul>

        <h3 className="danger-title">{t('settings.dangerZone')}</h3>
        <ul className="setting-rows setting-rows--danger">
          <li className="setting-row">
            <div>
              <p className="setting-row__title">{t('settings.reset')}</p>
              <p className="muted small">{t('settings.reset.body')}</p>
            </div>
            <button type="button" className="btn btn--danger-outline" onClick={() => setPending('reset')}>
              <Icon name="refresh" /> {t('settings.reset')}
            </button>
          </li>
          <li className="setting-row">
            <div>
              <p className="setting-row__title">{t('settings.clear')}</p>
              <p className="muted small">{t('settings.clear.body')}</p>
            </div>
            <button type="button" className="btn btn--danger" onClick={() => setPending('clear')}>
              <Icon name="trash" /> {t('settings.clear')}
            </button>
          </li>
        </ul>
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={pending === 'clear' ? t('confirm.clear.title') : t('confirm.reset.title')}
        body={pending === 'clear' ? t('confirm.clear.body') : t('confirm.reset.body')}
        confirmLabel={pending === 'clear' ? t('confirm.clear.action') : t('confirm.reset.action')}
        onConfirm={() => {
          if (pending === 'clear') {
            clearAll();
            notify('success', 'toast.dataCleared');
          } else {
            loadSampleData();
            notify('success', 'toast.dataReset');
          }
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
