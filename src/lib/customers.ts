import { CUSTOMER_STATUSES, type Customer, type CustomerStatus } from '../types/customer';
import { normalizeForSearch } from './text';

export const SORT_OPTIONS = ['updated', 'newest', 'oldest', 'name', 'value'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface CustomerFilters {
  query: string;
  status: CustomerStatus | 'all';
  city: string; // '' means all cities
  sort: SortOption;
}

export const DEFAULT_FILTERS: CustomerFilters = { query: '', status: 'all', city: '', sort: 'updated' };

export function hasActiveFilters(filters: CustomerFilters): boolean {
  return filters.query.trim() !== '' || filters.status !== 'all' || filters.city !== '';
}

function searchableText(c: Customer): string {
  return normalizeForSearch([c.name, c.company, c.email, c.phone, c.city].join(' '));
}

export function filterCustomers(customers: Customer[], filters: CustomerFilters, locale: string): Customer[] {
  const terms = normalizeForSearch(filters.query).split(' ').filter(Boolean);
  const city = normalizeForSearch(filters.city);

  const result = customers.filter((c) => {
    if (filters.status !== 'all' && c.status !== filters.status) return false;
    if (city && normalizeForSearch(c.city) !== city) return false;
    if (terms.length === 0) return true;
    const text = searchableText(c);
    return terms.every((term) => text.includes(term));
  });

  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const byDate = (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime();
  switch (filters.sort) {
    case 'name':
      return result.sort((a, b) => collator.compare(a.name, b.name));
    case 'value':
      return result.sort((a, b) => b.value - a.value);
    case 'newest':
      return result.sort((a, b) => byDate(b.createdAt, a.createdAt));
    case 'oldest':
      return result.sort((a, b) => byDate(a.createdAt, b.createdAt));
    default:
      return result.sort((a, b) => byDate(b.updatedAt, a.updatedAt));
  }
}

/** Unique cities (case/variant-insensitive), keeping the first spelling seen. */
export function uniqueCities(customers: Customer[], locale: string): string[] {
  const seen = new Map<string, string>();
  for (const c of customers) {
    const key = normalizeForSearch(c.city);
    if (key && !seen.has(key)) seen.set(key, c.city.trim());
  }
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  return [...seen.values()].sort(collator.compare);
}

export interface DashboardStats {
  total: number;
  byStatus: Record<CustomerStatus, number>;
  openPipelineValue: number;
  activeValue: number;
  newThisMonth: number;
}

export function computeStats(customers: Customer[], now = new Date()): DashboardStats {
  const byStatus = Object.fromEntries(CUSTOMER_STATUSES.map((s) => [s, 0])) as Record<CustomerStatus, number>;
  let openPipelineValue = 0;
  let activeValue = 0;
  let newThisMonth = 0;
  for (const c of customers) {
    byStatus[c.status] += 1;
    if (c.status === 'lead' || c.status === 'prospect') openPipelineValue += c.value;
    if (c.status === 'active') activeValue += c.value;
    const created = new Date(c.createdAt);
    if (created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()) newThisMonth += 1;
  }
  return { total: customers.length, byStatus, openPipelineValue, activeValue, newThisMonth };
}
