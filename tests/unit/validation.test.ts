import { describe, expect, it } from 'vitest';
import { isValidPhone, parseValue, toCustomerInput, validateCustomer, validateNote, type CustomerFormValues } from '../../src/lib/validation';
import type { Customer } from '../../src/types/customer';

const base: CustomerFormValues = { name: 'Sara', company: '', email: 'sara@example.com', phone: '', city: '', status: 'lead', value: '' };
const existing: Customer[] = [
  { id: '1', name: 'Other', company: '', email: 'taken@example.com', phone: '', city: '', status: 'lead', value: 0, notes: [], createdAt: '', updatedAt: '' },
];

describe('validateCustomer', () => {
  it('accepts a minimal valid customer', () => {
    expect(validateCustomer(base, existing)).toEqual({});
  });

  it('requires a name and some contact method', () => {
    const errors = validateCustomer({ ...base, name: '  ', email: '' }, existing);
    expect(errors.name).toBe('validation.nameRequired');
    expect(errors.email).toBe('validation.contactRequired');
    expect(errors.phone).toBe('validation.contactRequired');
  });

  it('rejects invalid and duplicate emails (case-insensitive), but not the record being edited', () => {
    expect(validateCustomer({ ...base, email: 'nope' }, existing).email).toBe('validation.emailInvalid');
    expect(validateCustomer({ ...base, email: 'TAKEN@example.com' }, existing).email).toBe('validation.emailDuplicate');
    expect(validateCustomer({ ...base, email: 'taken@example.com' }, existing, '1').email).toBeUndefined();
  });

  it('rejects non-numeric values', () => {
    expect(validateCustomer({ ...base, value: '12abc' }, existing).value).toBe('validation.valueInvalid');
    expect(validateCustomer({ ...base, value: '-5' }, existing).value).toBe('validation.valueInvalid');
  });
});

describe('phone and number parsing', () => {
  it('accepts Saudi mobile formats, international numbers and Arabic-Indic digits', () => {
    for (const ok of ['0501234567', '+966501234567', '966 50 123 4567', '٠٥٠١٢٣٤٥٦٧', '+447700900123']) {
      expect(isValidPhone(ok), ok).toBe(true);
    }
    for (const bad of ['12345', '0401234567', 'phone', '+12']) {
      expect(isValidPhone(bad), bad).toBe(false);
    }
  });

  it('parses Latin and Arabic-Indic digits with separators', () => {
    expect(parseValue('')).toBe(0);
    expect(parseValue('12,500')).toBe(12500);
    expect(parseValue('١٢٥٠٠')).toBe(12500);
    expect(parseValue('99.5')).toBe(99.5);
    expect(parseValue('abc')).toBeNull();
  });

  it('normalizes input before saving', () => {
    const input = toCustomerInput({ ...base, name: ' Sara ', email: ' SARA@Example.com ', phone: '050 123 4567', value: '١٠٠' });
    expect(input).toMatchObject({ name: 'Sara', email: 'sara@example.com', phone: '0501234567', value: 100 });
  });
});

describe('validateNote', () => {
  it('requires text and enforces the length limit', () => {
    expect(validateNote('   ')).toBe('validation.noteRequired');
    expect(validateNote('x'.repeat(1001))).toBe('validation.noteTooLong');
    expect(validateNote('Call back Sunday')).toBeNull();
  });
});
