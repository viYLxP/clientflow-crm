import { isCustomerStatus, type Activity, type CrmData, type Customer, type Note } from '../types/customer';

export const DATA_STORAGE_KEY = 'clientflow.data';
export const CORRUPT_BACKUP_KEY = 'clientflow.data.unreadable-backup';
const SCHEMA_VERSION = 1;

interface StoredData extends CrmData {
  version: number;
}

export type LoadResult =
  | { kind: 'ok'; data: CrmData }
  | { kind: 'empty' }
  | { kind: 'corrupt' };

const isString = (v: unknown): v is string => typeof v === 'string';
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function isNote(v: unknown): v is Note {
  return isRecord(v) && isString(v.id) && isString(v.body) && isString(v.createdAt) &&
    (v.updatedAt === undefined || isString(v.updatedAt));
}

function isCustomer(v: unknown): v is Customer {
  return (
    isRecord(v) &&
    isString(v.id) && isString(v.name) && isString(v.company) && isString(v.email) &&
    isString(v.phone) && isString(v.city) && isCustomerStatus(v.status) &&
    typeof v.value === 'number' && Number.isFinite(v.value) && v.value >= 0 &&
    Array.isArray(v.notes) && v.notes.every(isNote) &&
    isString(v.createdAt) && isString(v.updatedAt)
  );
}

function isActivity(v: unknown): v is Activity {
  return (
    isRecord(v) && isString(v.id) && isString(v.customerId) && isString(v.customerName) &&
    isString(v.at) && ['created', 'updated', 'status', 'note', 'deleted'].includes(v.type as string) &&
    (v.from === undefined || isCustomerStatus(v.from)) &&
    (v.to === undefined || isCustomerStatus(v.to))
  );
}

/** Validates unknown JSON (from storage or an imported file). Returns null if it is not CRM data. */
export function parseCrmData(raw: unknown): CrmData | null {
  if (!isRecord(raw) || !Array.isArray(raw.customers) || !raw.customers.every(isCustomer)) return null;
  const activity = Array.isArray(raw.activity) ? raw.activity.filter(isActivity) : [];
  return { customers: raw.customers, activity };
}

export function loadData(): LoadResult {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(DATA_STORAGE_KEY);
  } catch {
    return { kind: 'empty' };
  }
  if (raw === null) return { kind: 'empty' };
  try {
    const data = parseCrmData(JSON.parse(raw));
    if (data) return { kind: 'ok', data };
  } catch {
    // fall through to corrupt handling
  }
  try {
    window.localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
  } catch {
    // best effort
  }
  return { kind: 'corrupt' };
}

/** Returns false when the browser refuses the write (quota exceeded, storage disabled). */
export function saveData(data: CrmData): boolean {
  try {
    const payload: StoredData = { version: SCHEMA_VERSION, ...data };
    window.localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function serializeForExport(data: CrmData): string {
  const payload: StoredData & { exportedAt: string; app: string } = {
    app: 'ClientFlow CRM',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    ...data,
  };
  return JSON.stringify(payload, null, 2);
}
