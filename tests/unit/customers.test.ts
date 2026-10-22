import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, computeStats, filterCustomers, uniqueCities } from '../../src/lib/customers';
import { parseCrmData } from '../../src/lib/storage';
import { crmReducer } from '../../src/store/crmReducer';
import type { Customer } from '../../src/types/customer';

const make = (over: Partial<Customer>): Customer => ({
  id: over.id ?? Math.random().toString(36),
  name: 'X', company: '', email: '', phone: '', city: '', status: 'lead', value: 0, notes: [],
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const customers = [
  make({ id: 'a', name: 'سارة القحطاني', city: 'الرياض', status: 'active', value: 100, email: 'sara@x.sa' }),
  make({ id: 'b', name: 'Fahad Otaibi', city: 'Jeddah', status: 'prospect', value: 300, phone: '0551112233' }),
  make({ id: 'c', name: 'أحمد', city: 'الرياض', status: 'lead', value: 200 }),
];

describe('filterCustomers', () => {
  it('matches Arabic text regardless of hamza and taa marbuta variants', () => {
    const result = filterCustomers(customers, { ...DEFAULT_FILTERS, query: 'ساره' }, 'ar');
    expect(result.map((c) => c.id)).toEqual(['a']);
    expect(filterCustomers(customers, { ...DEFAULT_FILTERS, query: 'احمد' }, 'ar').map((c) => c.id)).toEqual(['c']);
  });

  it('searches phone numbers typed with Arabic-Indic digits', () => {
    expect(filterCustomers(customers, { ...DEFAULT_FILTERS, query: '٠٥٥١' }, 'ar').map((c) => c.id)).toEqual(['b']);
  });

  it('combines status and city filters, and sorts by value', () => {
    expect(filterCustomers(customers, { ...DEFAULT_FILTERS, city: 'الرياض', sort: 'value' }, 'ar').map((c) => c.id)).toEqual(['c', 'a']);
    expect(filterCustomers(customers, { ...DEFAULT_FILTERS, status: 'prospect' }, 'en').map((c) => c.id)).toEqual(['b']);
  });

  it('lists unique cities', () => {
    expect(uniqueCities(customers, 'en')).toHaveLength(2);
  });
});

describe('computeStats', () => {
  it('sums pipeline (lead + prospect) and active value separately', () => {
    const stats = computeStats(customers, new Date('2026-01-15'));
    expect(stats).toMatchObject({ total: 3, openPipelineValue: 500, activeValue: 100, newThisMonth: 3 });
    expect(stats.byStatus).toEqual({ lead: 1, prospect: 1, active: 1, inactive: 0 });
  });
});

describe('crmReducer', () => {
  const state = { customers, activity: [] };
  const act = { id: 'act', type: 'status' as const, customerId: 'b', customerName: 'Fahad', at: 'now' };

  it('changes status and records activity', () => {
    const next = crmReducer(state, { type: 'setStatus', id: 'b', status: 'active', at: '2026-02-01', activity: act });
    expect(next.customers.find((c) => c.id === 'b')?.status).toBe('active');
    expect(next.activity[0]).toBe(act);
  });

  it('adds, edits and deletes notes', () => {
    let next = crmReducer(state, { type: 'addNote', id: 'a', noteId: 'n1', body: 'hello', at: 't1', activity: { ...act, type: 'note' } });
    expect(next.customers[0].notes[0]).toMatchObject({ id: 'n1', body: 'hello' });
    next = crmReducer(next, { type: 'updateNote', id: 'a', noteId: 'n1', body: 'edited', at: 't2' });
    expect(next.customers[0].notes[0]).toMatchObject({ body: 'edited', updatedAt: 't2' });
    next = crmReducer(next, { type: 'deleteNote', id: 'a', noteId: 'n1', at: 't3' });
    expect(next.customers[0].notes).toHaveLength(0);
  });

  it('removes a customer', () => {
    const next = crmReducer(state, { type: 'remove', id: 'a', activity: { ...act, type: 'deleted' } });
    expect(next.customers.map((c) => c.id)).toEqual(['b', 'c']);
  });
});

describe('parseCrmData', () => {
  it('accepts valid data and rejects malformed data', () => {
    expect(parseCrmData({ customers, activity: [] })?.customers).toHaveLength(3);
    expect(parseCrmData({ customers: [{ name: 'broken' }] })).toBeNull();
    expect(parseCrmData('nope')).toBeNull();
    expect(parseCrmData({ customers: [{ ...customers[0], status: 'vip' }] })).toBeNull();
  });
});
