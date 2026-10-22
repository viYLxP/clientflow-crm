import type { TranslationKey } from '../i18n';
import type { Customer, CustomerInput, CustomerStatus } from '../types/customer';
import { toLatinDigits } from './text';

/** Raw form values are strings so partially typed input survives re-renders and language switches. */
export interface CustomerFormValues {
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  status: CustomerStatus;
  value: string;
}

export type CustomerFormErrors = Partial<Record<keyof CustomerFormValues, TranslationKey>>;

export const LIMITS = { name: 80, company: 80, city: 60, note: 1000, value: 1_000_000_000 } as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SAUDI_MOBILE = /^(?:\+966|00966|966|0)?5\d{8}$/;
const INTERNATIONAL = /^\+\d{8,15}$/;

export function normalizePhone(value: string): string {
  return toLatinDigits(value).replace(/[\s\-().]/g, '');
}

export function isValidPhone(value: string): boolean {
  const phone = normalizePhone(value);
  return SAUDI_MOBILE.test(phone) || INTERNATIONAL.test(phone);
}

export function parseValue(value: string): number | null {
  const cleaned = toLatinDigits(value).replace(/[,\s٬]/g, '').replace('٫', '.');
  if (cleaned === '') return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Number(cleaned);
}

export function validateCustomer(
  values: CustomerFormValues,
  existing: Customer[],
  editingId?: string,
): CustomerFormErrors {
  const errors: CustomerFormErrors = {};
  const name = values.name.trim();
  const email = values.email.trim().toLowerCase();
  const phone = values.phone.trim();

  if (!name) errors.name = 'validation.nameRequired';
  else if (name.length > LIMITS.name) errors.name = 'validation.nameTooLong';

  if (values.company.trim().length > LIMITS.company) errors.company = 'validation.companyTooLong';
  if (values.city.trim().length > LIMITS.city) errors.city = 'validation.cityTooLong';

  if (!email && !phone) {
    errors.email = 'validation.contactRequired';
    errors.phone = 'validation.contactRequired';
  }
  if (email) {
    if (!EMAIL_PATTERN.test(email)) errors.email = 'validation.emailInvalid';
    else if (existing.some((c) => c.id !== editingId && c.email.toLowerCase() === email)) {
      errors.email = 'validation.emailDuplicate';
    }
  }
  if (phone && !isValidPhone(phone)) errors.phone = 'validation.phoneInvalid';

  const parsed = parseValue(values.value);
  if (parsed === null) errors.value = 'validation.valueInvalid';
  else if (parsed > LIMITS.value) errors.value = 'validation.valueTooLarge';

  return errors;
}

export function toCustomerInput(values: CustomerFormValues): CustomerInput {
  return {
    name: values.name.trim(),
    company: values.company.trim(),
    email: values.email.trim().toLowerCase(),
    phone: normalizePhone(values.phone.trim()),
    city: values.city.trim(),
    status: values.status,
    value: parseValue(values.value) ?? 0,
  };
}

export function toFormValues(customer?: Customer): CustomerFormValues {
  return {
    name: customer?.name ?? '',
    company: customer?.company ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    city: customer?.city ?? '',
    status: customer?.status ?? 'lead',
    value: customer && customer.value > 0 ? String(customer.value) : '',
  };
}

export function validateNote(body: string): TranslationKey | null {
  const text = body.trim();
  if (!text) return 'validation.noteRequired';
  if (text.length > LIMITS.note) return 'validation.noteTooLong';
  return null;
}
