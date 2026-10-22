export const CUSTOMER_STATUSES = ['lead', 'prospect', 'active', 'inactive'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export interface Note {
  id: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  status: CustomerStatus;
  /** Deal value in SAR. */
  value: number;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

/** Fields the user edits in the customer form. */
export type CustomerInput = Pick<Customer, 'name' | 'company' | 'email' | 'phone' | 'city' | 'status' | 'value'>;

export type ActivityType = 'created' | 'updated' | 'status' | 'note' | 'deleted';

/**
 * Activity entries store codes, not sentences, so they are rendered in whichever
 * language is active. customerName is a snapshot so deleted customers still read well.
 */
export interface Activity {
  id: string;
  type: ActivityType;
  customerId: string;
  customerName: string;
  from?: CustomerStatus;
  to?: CustomerStatus;
  at: string;
}

export interface CrmData {
  customers: Customer[];
  activity: Activity[];
}

export function isCustomerStatus(value: unknown): value is CustomerStatus {
  return typeof value === 'string' && (CUSTOMER_STATUSES as readonly string[]).includes(value);
}
