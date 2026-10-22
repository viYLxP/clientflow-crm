import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { createSampleData } from '../lib/sampleData';
import { loadData, saveData } from '../lib/storage';
import { createId } from '../lib/text';
import type { Activity, CrmData, Customer, CustomerInput, CustomerStatus } from '../types/customer';
import { crmReducer } from './crmReducer';
import { useToast } from './ToastContext';

interface CrmContextValue {
  customers: Customer[];
  activity: Activity[];
  /** True when stored data existed but could not be parsed. */
  loadFailed: boolean;
  dismissLoadError: () => void;
  getCustomer: (id: string) => Customer | undefined;
  addCustomer: (input: CustomerInput) => Customer;
  updateCustomer: (id: string, input: CustomerInput) => void;
  deleteCustomer: (id: string) => void;
  setStatus: (id: string, status: CustomerStatus) => void;
  addNote: (customerId: string, body: string) => void;
  updateNote: (customerId: string, noteId: string, body: string) => void;
  deleteNote: (customerId: string, noteId: string) => void;
  replaceAll: (data: CrmData) => void;
  loadSampleData: () => void;
  clearAll: () => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

const now = () => new Date().toISOString();

export function CrmProvider({ children }: { children: ReactNode }) {
  const { language } = useI18n();
  const { notify } = useToast();

  // Read storage once. First-ever visit gets sample data so the demo is explorable.
  const [initial] = useState(() => {
    const result = loadData();
    if (result.kind === 'ok') return { data: result.data, failed: false };
    if (result.kind === 'corrupt') return { data: { customers: [], activity: [] }, failed: true };
    return { data: createSampleData(language), failed: false };
  });
  const [state, dispatch] = useReducer(crmReducer, initial.data);
  const [loadFailed, setLoadFailed] = useState(initial.failed);

  const lastSaveFailed = useRef(false);

  useEffect(() => {
    // Do not overwrite unreadable data until the user changes something.
    if (initial.failed && state === initial.data) return;
    const ok = saveData(state);
    if (!ok && !lastSaveFailed.current) notify('error', 'toast.storageError');
    lastSaveFailed.current = !ok;
  }, [state, initial, notify]);

  const value = useMemo<CrmContextValue>(() => {
    const find = (id: string) => state.customers.find((c) => c.id === id);
    const entry = (type: Activity['type'], customer: Pick<Customer, 'id' | 'name'>, at: string, extra?: Partial<Activity>): Activity => ({
      id: createId(), type, customerId: customer.id, customerName: customer.name, at, ...extra,
    });

    return {
      customers: state.customers,
      activity: state.activity,
      loadFailed,
      dismissLoadError: () => setLoadFailed(false),
      getCustomer: find,

      addCustomer: (input) => {
        const at = now();
        const customer: Customer = { ...input, id: createId(), notes: [], createdAt: at, updatedAt: at };
        dispatch({ type: 'add', customer, activity: entry('created', customer, at) });
        return customer;
      },

      updateCustomer: (id, input) => {
        const before = find(id);
        if (!before) return;
        const at = now();
        const activity = [entry('updated', { id, name: input.name }, at)];
        if (before.status !== input.status) {
          activity.unshift(entry('status', { id, name: input.name }, at, { from: before.status, to: input.status }));
        }
        dispatch({ type: 'update', id, input, at, activity });
      },

      deleteCustomer: (id) => {
        const customer = find(id);
        if (!customer) return;
        dispatch({ type: 'remove', id, activity: entry('deleted', customer, now()) });
      },

      setStatus: (id, status) => {
        const customer = find(id);
        if (!customer || customer.status === status) return;
        const at = now();
        dispatch({ type: 'setStatus', id, status, at, activity: entry('status', customer, at, { from: customer.status, to: status }) });
      },

      addNote: (customerId, body) => {
        const customer = find(customerId);
        if (!customer) return;
        const at = now();
        dispatch({ type: 'addNote', id: customerId, noteId: createId(), body: body.trim(), at, activity: entry('note', customer, at) });
      },

      updateNote: (customerId, noteId, body) =>
        dispatch({ type: 'updateNote', id: customerId, noteId, body: body.trim(), at: now() }),

      deleteNote: (customerId, noteId) => dispatch({ type: 'deleteNote', id: customerId, noteId, at: now() }),

      replaceAll: (data) => {
        setLoadFailed(false);
        dispatch({ type: 'replace', data });
      },
      loadSampleData: () => {
        setLoadFailed(false);
        dispatch({ type: 'replace', data: createSampleData(language) });
      },
      clearAll: () => {
        setLoadFailed(false);
        dispatch({ type: 'replace', data: { customers: [], activity: [] } });
      },
    };
  }, [state, loadFailed, language]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const context = useContext(CrmContext);
  if (!context) throw new Error('useCrm must be used inside <CrmProvider>');
  return context;
}
