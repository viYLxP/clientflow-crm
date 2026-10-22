import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { ConfirmDialog, EmptyState, Ltr, PageHeader, StatusSelect } from '../components/ui';
import { paths } from '../hooks/useHashRoute';
import { useI18n } from '../i18n';
import {
  DEFAULT_FILTERS,
  SORT_OPTIONS,
  filterCustomers,
  hasActiveFilters,
  uniqueCities,
  type CustomerFilters,
} from '../lib/customers';
import { initials } from '../lib/text';
import { useCrm } from '../store/CrmContext';
import { useToast } from '../store/ToastContext';
import { CUSTOMER_STATUSES, isCustomerStatus, type Customer } from '../types/customer';

// Filters survive navigating to a customer and back (per tab, not across sessions).
const FILTERS_KEY = 'clientflow.customerFilters';

function loadFilters(): CustomerFilters {
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(FILTERS_KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      return {
        query: typeof raw.query === 'string' ? raw.query : '',
        status: isCustomerStatus(raw.status) ? raw.status : 'all',
        city: typeof raw.city === 'string' ? raw.city : '',
        sort: SORT_OPTIONS.includes(raw.sort) ? raw.sort : DEFAULT_FILTERS.sort,
      };
    }
  } catch {
    // ignore unreadable session state
  }
  return DEFAULT_FILTERS;
}

export default function CustomersPage() {
  const { t, locale, formatCurrency, formatDate, formatNumber } = useI18n();
  const { customers, setStatus, deleteCustomer } = useCrm();
  const { notify } = useToast();
  const [filters, setFilters] = useState<CustomerFilters>(loadFilters);
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
    } catch {
      // non-essential
    }
  }, [filters]);

  const cities = useMemo(() => uniqueCities(customers, locale), [customers, locale]);
  const visible = useMemo(() => filterCustomers(customers, filters, locale), [customers, filters, locale]);
  const filtered = hasActiveFilters(filters);
  const update = (patch: Partial<CustomerFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const changeStatus = (customer: Customer, status: Customer['status']) => {
    setStatus(customer.id, status);
    notify('success', 'toast.statusChanged', { name: customer.name, status: { key: `status.${status}` } });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteCustomer(pendingDelete.id);
    notify('success', 'toast.customerDeleted', { name: pendingDelete.name });
    setPendingDelete(null);
  };

  return (
    <>
      <PageHeader
        title={t('customers.title')}
        subtitle={t('customers.subtitle')}
        actions={
          <a className="btn btn--primary" href={paths.customerNew()} data-testid="add-customer">
            <Icon name="plus" /> {t('customers.add')}
          </a>
        }
      />

      {customers.length === 0 ? (
        <EmptyState icon="users" title={t('customers.empty.title')} body={t('customers.empty.body')}>
          <a className="btn btn--primary" href={paths.customerNew()}>
            <Icon name="plus" /> {t('customers.add')}
          </a>
        </EmptyState>
      ) : (
        <>
          <div className="toolbar" role="search">
            <div className="search">
              <label htmlFor="customer-search" className="visually-hidden">{t('customers.searchLabel')}</label>
              <Icon name="search" className="search__icon" />
              <input
                id="customer-search"
                type="search"
                className="input search__input"
                placeholder={t('customers.searchPlaceholder')}
                value={filters.query}
                onChange={(e) => update({ query: e.target.value })}
                autoComplete="off"
              />
              {filters.query && (
                <button type="button" className="icon-btn search__clear" onClick={() => update({ query: '' })} aria-label={t('customers.clearSearch')}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <div className="toolbar__filters">
              <label className="field field--inline">
                <span className="visually-hidden">{t('customers.filterStatus')}</span>
                <select className="select" value={filters.status} onChange={(e) => update({ status: e.target.value as CustomerFilters['status'] })}>
                  <option value="all">{t('status.all')}</option>
                  {CUSTOMER_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                </select>
              </label>
              <label className="field field--inline">
                <span className="visually-hidden">{t('customers.filterCity')}</span>
                <select className="select" value={filters.city} onChange={(e) => update({ city: e.target.value })}>
                  <option value="">{t('customers.allCities')}</option>
                  {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </label>
              <label className="field field--inline">
                <span className="toolbar__label">{t('customers.sortLabel')}</span>
                <select className="select" value={filters.sort} onChange={(e) => update({ sort: e.target.value as CustomerFilters['sort'] })}>
                  {SORT_OPTIONS.map((s) => <option key={s} value={s}>{t(`customers.sort.${s}`)}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="results-bar">
            <p role="status" aria-live="polite" data-testid="results-count">
              {t('customers.results', { count: formatNumber(visible.length), total: formatNumber(customers.length) })}
            </p>
            {filtered && (
              <button type="button" className="link-btn" onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }))}>
                {t('customers.clearFilters')}
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <EmptyState icon="search" title={t('customers.noResults.title')} body={t('customers.noResults.body')}>
              <button type="button" className="btn btn--secondary" onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }))}>
                {t('customers.clearFilters')}
              </button>
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <caption className="visually-hidden">{t('customers.tableCaption')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('table.name')}</th>
                    <th scope="col">{t('table.contact')}</th>
                    <th scope="col">{t('table.city')}</th>
                    <th scope="col">{t('table.status')}</th>
                    <th scope="col" className="num">{t('table.value')}</th>
                    <th scope="col">{t('table.updated')}</th>
                    <th scope="col"><span className="visually-hidden">{t('table.actions')}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr key={c.id} data-testid="customer-row">
                      <td data-label={t('table.name')}>
                        <a className="person" href={paths.customer(c.id)}>
                          <span className="avatar" aria-hidden="true">{initials(c.name)}</span>
                          <span>
                            <span className="person__name">{c.name}</span>
                            {c.company && <span className="person__meta">{c.company}</span>}
                          </span>
                        </a>
                      </td>
                      <td data-label={t('table.contact')}>
                        <span className="contact-lines">
                          {c.email && <Ltr title={c.email}>{c.email}</Ltr>}
                          {c.phone && <Ltr className="muted">{c.phone}</Ltr>}
                        </span>
                      </td>
                      <td data-label={t('table.city')}>{c.city || <span className="muted">—</span>}</td>
                      <td data-label={t('table.status')}>
                        <StatusSelect value={c.status} label={t('status.changeFor', { name: c.name })} onChange={(s) => changeStatus(c, s)} />
                      </td>
                      <td data-label={t('table.value')} className="num">{formatCurrency(c.value)}</td>
                      <td data-label={t('table.updated')}>
                        <time dateTime={c.updatedAt}>{formatDate(c.updatedAt)}</time>
                      </td>
                      <td className="row-actions">
                        <a className="icon-btn" href={paths.customer(c.id)} aria-label={t('table.viewCustomer', { name: c.name })} title={t('common.view')}>
                          <Icon name="eye" />
                        </a>
                        <a className="icon-btn" href={paths.customerEdit(c.id)} aria-label={t('table.editCustomer', { name: c.name })} title={t('common.edit')}>
                          <Icon name="edit" />
                        </a>
                        <button type="button" className="icon-btn icon-btn--danger" onClick={() => setPendingDelete(c)} aria-label={t('table.deleteCustomer', { name: c.name })} title={t('common.delete')}>
                          <Icon name="trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('confirm.deleteCustomer.title')}
        body={t('confirm.deleteCustomer.body', { name: pendingDelete?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
