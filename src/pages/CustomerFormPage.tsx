import { useRef, useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { EmptyState, PageHeader } from '../components/ui';
import { navigate, paths } from '../hooks/useHashRoute';
import { useI18n, type TranslationKey } from '../i18n';
import {
  LIMITS,
  toCustomerInput,
  toFormValues,
  validateCustomer,
  type CustomerFormErrors,
  type CustomerFormValues,
} from '../lib/validation';
import { useCrm } from '../store/CrmContext';
import { useToast } from '../store/ToastContext';
import { CUSTOMER_STATUSES } from '../types/customer';

const FIELD_ORDER: (keyof CustomerFormValues)[] = ['name', 'company', 'email', 'phone', 'city', 'status', 'value'];

interface FieldProps {
  id: keyof CustomerFormValues;
  label: TranslationKey;
  error?: TranslationKey;
  hint?: TranslationKey;
  required?: boolean;
  children: (describedBy: string | undefined, invalid: boolean) => React.ReactNode;
}

function Field({ id, label, error, hint, required, children }: FieldProps) {
  const { t } = useI18n();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label htmlFor={`field-${id}`} className="field__label">
        {t(label)}
        {required ? <span className="field__required" aria-hidden="true"> *</span> : <span className="field__optional"> ({t('common.optional')})</span>}
      </label>
      {children(describedBy, Boolean(error))}
      {hint && <p id={`${id}-hint`} className="field__hint">{t(hint)}</p>}
      {error && (
        <p id={`${id}-error`} className="field__error">
          <Icon name="alert" size={14} /> {t(error)}
        </p>
      )}
    </div>
  );
}

export default function CustomerFormPage({ id }: { id?: string }) {
  const { t } = useI18n();
  const { customers, getCustomer, addCustomer, updateCustomer } = useCrm();
  const { notify } = useToast();
  const existing = id ? getCustomer(id) : undefined;

  // Form state lives here (not in the language context), so switching language keeps typed values.
  const [values, setValues] = useState<CustomerFormValues>(() => toFormValues(existing));
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (id && !existing) {
    return (
      <EmptyState icon="users" title={t('detail.notFound.title')} body={t('detail.notFound.body')}>
        <a className="btn btn--secondary" href={paths.customers()}>{t('detail.backToList')}</a>
      </EmptyState>
    );
  }

  const set = (field: keyof CustomerFormValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // After the first submit attempt, re-validate as the user types so errors clear promptly.
    if (submitted) setErrors(validateCustomer(next, customers, id));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateCustomer(values, customers, id);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#field-${firstInvalid}`)?.focus();
      return;
    }
    const input = toCustomerInput(values);
    if (existing) {
      updateCustomer(existing.id, input);
      notify('success', 'toast.customerUpdated', { name: input.name });
      navigate(paths.customer(existing.id));
    } else {
      const created = addCustomer(input);
      notify('success', 'toast.customerAdded', { name: created.name });
      navigate(paths.customer(created.id));
    }
  };

  const errorCount = Object.keys(errors).length;
  const cancelHref = existing ? paths.customer(existing.id) : paths.customers();
  const inputProps = (field: keyof CustomerFormValues, describedBy: string | undefined, invalid: boolean) => ({
    id: `field-${field}`,
    name: field,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(field, e.target.value),
    'aria-describedby': describedBy,
    'aria-invalid': invalid || undefined,
  });

  return (
    <>
      <a className="back-link" href={cancelHref}>
        <Icon name="arrowBack" size={16} /> {existing ? existing.name : t('detail.backToList')}
      </a>
      <PageHeader
        title={existing ? t('form.editTitle') : t('form.addTitle')}
        subtitle={existing ? t('form.editSubtitle', { name: existing.name }) : t('form.addSubtitle')}
      />

      <form ref={formRef} className="card form" onSubmit={onSubmit} noValidate data-testid="customer-form">
        {errorCount > 0 && (
          <div className="banner banner--error" role="alert">
            <Icon name="alert" />
            <p>{t('form.errorSummary', { count: errorCount })}</p>
          </div>
        )}

        <div className="form-grid">
          <Field id="name" label="field.name" error={errors.name} required>
            {(d, inv) => <input className="input" type="text" autoComplete="name" maxLength={LIMITS.name + 20} placeholder={t('field.namePlaceholder')} {...inputProps('name', d, inv)} />}
          </Field>
          <Field id="company" label="field.company" error={errors.company}>
            {(d, inv) => <input className="input" type="text" autoComplete="organization" placeholder={t('field.companyPlaceholder')} {...inputProps('company', d, inv)} />}
          </Field>
          <Field id="email" label="field.email" error={errors.email} hint="field.emailHint">
            {(d, inv) => <input className="input input--ltr" type="email" dir="ltr" autoComplete="email" placeholder="name@company.com" {...inputProps('email', d, inv)} />}
          </Field>
          <Field id="phone" label="field.phone" error={errors.phone} hint="field.phoneHint">
            {(d, inv) => <input className="input input--ltr" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="05XXXXXXXX" {...inputProps('phone', d, inv)} />}
          </Field>
          <Field id="city" label="field.city" error={errors.city}>
            {(d, inv) => <input className="input" type="text" autoComplete="address-level2" placeholder={t('field.cityPlaceholder')} {...inputProps('city', d, inv)} />}
          </Field>
          <Field id="status" label="field.status" required>
            {(d, inv) => (
              <select className="select" {...inputProps('status', d, inv)}>
                {CUSTOMER_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
              </select>
            )}
          </Field>
          <Field id="value" label="field.value" error={errors.value} hint="field.valueHint">
            {(d, inv) => <input className="input input--ltr" type="text" dir="ltr" inputMode="decimal" placeholder="0" {...inputProps('value', d, inv)} />}
          </Field>
        </div>

        <div className="form__actions">
          <a className="btn btn--secondary" href={cancelHref}>{t('common.cancel')}</a>
          <button type="submit" className="btn btn--primary">
            <Icon name="check" /> {existing ? t('form.submitEdit') : t('form.submitAdd')}
          </button>
        </div>
      </form>
    </>
  );
}
