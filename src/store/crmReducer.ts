import type { Activity, CrmData, Customer, CustomerInput, CustomerStatus } from '../types/customer';

const MAX_ACTIVITY = 100;

// Ids and timestamps are created by the caller so the reducer stays pure.
export type CrmAction =
  | { type: 'add'; customer: Customer; activity: Activity }
  | { type: 'update'; id: string; input: CustomerInput; at: string; activity: Activity[] }
  | { type: 'remove'; id: string; activity: Activity }
  | { type: 'setStatus'; id: string; status: CustomerStatus; at: string; activity: Activity }
  | { type: 'addNote'; id: string; noteId: string; body: string; at: string; activity: Activity }
  | { type: 'updateNote'; id: string; noteId: string; body: string; at: string }
  | { type: 'deleteNote'; id: string; noteId: string; at: string }
  | { type: 'replace'; data: CrmData };

function withActivity(activity: Activity[], entries: Activity[]): Activity[] {
  return [...entries, ...activity].slice(0, MAX_ACTIVITY);
}

function mapCustomer(customers: Customer[], id: string, fn: (c: Customer) => Customer): Customer[] {
  return customers.map((c) => (c.id === id ? fn(c) : c));
}

export function crmReducer(state: CrmData, action: CrmAction): CrmData {
  switch (action.type) {
    case 'add':
      return {
        customers: [action.customer, ...state.customers],
        activity: withActivity(state.activity, [action.activity]),
      };
    case 'update':
      return {
        customers: mapCustomer(state.customers, action.id, (c) => ({ ...c, ...action.input, updatedAt: action.at })),
        activity: withActivity(state.activity, action.activity),
      };
    case 'remove':
      return {
        customers: state.customers.filter((c) => c.id !== action.id),
        activity: withActivity(state.activity, [action.activity]),
      };
    case 'setStatus':
      return {
        customers: mapCustomer(state.customers, action.id, (c) => ({ ...c, status: action.status, updatedAt: action.at })),
        activity: withActivity(state.activity, [action.activity]),
      };
    case 'addNote':
      return {
        customers: mapCustomer(state.customers, action.id, (c) => ({
          ...c,
          notes: [{ id: action.noteId, body: action.body, createdAt: action.at }, ...c.notes],
          updatedAt: action.at,
        })),
        activity: withActivity(state.activity, [action.activity]),
      };
    case 'updateNote':
      return {
        ...state,
        customers: mapCustomer(state.customers, action.id, (c) => ({
          ...c,
          notes: c.notes.map((n) => (n.id === action.noteId ? { ...n, body: action.body, updatedAt: action.at } : n)),
          updatedAt: action.at,
        })),
      };
    case 'deleteNote':
      return {
        ...state,
        customers: mapCustomer(state.customers, action.id, (c) => ({
          ...c,
          notes: c.notes.filter((n) => n.id !== action.noteId),
          updatedAt: action.at,
        })),
      };
    case 'replace':
      return action.data;
  }
}
