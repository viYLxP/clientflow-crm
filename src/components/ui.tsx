import { useEffect, useRef, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import type { CustomerStatus } from '../types/customer';
import { CUSTOMER_STATUSES } from '../types/customer';
import { Icon, type IconName } from './Icon';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {/* Focus target after route changes so screen readers announce the new page. */}
        <h1 id="page-title" tabIndex={-1}>{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function StatusBadge({ status }: { status: CustomerStatus }) {
  const { t } = useI18n();
  return <span className={`badge badge--${status}`}>{t(`status.${status}`)}</span>;
}

interface StatusSelectProps {
  value: CustomerStatus;
  onChange: (status: CustomerStatus) => void;
  label: string;
  id?: string;
}

export function StatusSelect({ value, onChange, label, id }: StatusSelectProps) {
  const { t } = useI18n();
  return (
    <select
      id={id}
      className={`select select--status select--${value}`}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value as CustomerStatus)}
    >
      {CUSTOMER_STATUSES.map((s) => (
        <option key={s} value={s}>{t(`status.${s}`)}</option>
      ))}
    </select>
  );
}

export function EmptyState({ icon, title, body, children }: { icon: IconName; title: string; body: string; children?: ReactNode }) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state__icon"><Icon name={icon} size={28} /></span>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__body">{body}</p>
      {children && <div className="empty-state__actions">{children}</div>}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** Email, phone and URL values stay LTR inside Arabic text so they remain readable. */
export function Ltr({ children, className = '', title }: { children: ReactNode; className?: string; title?: string }) {
  return <bdi dir="ltr" className={`ltr ${className}`} title={title}>{children}</bdi>;
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Native <dialog> gives focus trapping, Escape-to-close and an inert background for free. */
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel(); // backdrop click
      }}
    >
      {open && (
        <div className="dialog__content">
          <span className="dialog__icon"><Icon name="alert" size={22} /></span>
          <h2 id="confirm-title" className="dialog__title">{title}</h2>
          <p id="confirm-body" className="dialog__body">{body}</p>
          <div className="dialog__actions">
            <button type="button" className="btn btn--secondary" onClick={onCancel} autoFocus>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn--danger" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
