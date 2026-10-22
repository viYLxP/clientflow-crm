import { useI18n } from '../i18n';
import { useToast, type ToastParam } from '../store/ToastContext';
import { Icon } from './Icon';

const ICONS = { success: 'check', error: 'alert', info: 'info' } as const;

/** Toast text is translated at render time, so open toasts follow a language switch. */
export function Toasts() {
  const { toasts, dismiss } = useToast();
  const { t } = useI18n();

  const resolve = (params?: Record<string, ToastParam>) =>
    params &&
    Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, typeof v === 'object' ? t(v.key) : v]),
    );

  return (
    <section className="toasts" aria-label={t('common.notifications')}>
      {/* Separate live regions so errors interrupt and successes do not. */}
      <div role="status" aria-live="polite" className="toasts__list">
        {toasts.filter((x) => x.kind !== 'error').map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind}`}>
            <Icon name={ICONS[toast.kind]} />
            <p className="toast__message">{t(toast.message, resolve(toast.params))}</p>
            <button type="button" className="icon-btn" onClick={() => dismiss(toast.id)} aria-label={t('common.dismiss')}>
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
      <div role="alert" className="toasts__list">
        {toasts.filter((x) => x.kind === 'error').map((toast) => (
          <div key={toast.id} className="toast toast--error">
            <Icon name="alert" />
            <p className="toast__message">{t(toast.message, resolve(toast.params))}</p>
            <button type="button" className="icon-btn" onClick={() => dismiss(toast.id)} aria-label={t('common.dismiss')}>
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
