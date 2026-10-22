import { useMemo } from 'react';
import { ActivityItem } from '../components/ActivityItem';
import { Icon, type IconName } from '../components/Icon';
import { EmptyState, PageHeader, StatusBadge } from '../components/ui';
import { paths } from '../hooks/useHashRoute';
import { useI18n } from '../i18n';
import { computeStats } from '../lib/customers';
import { initials } from '../lib/text';
import { useCrm } from '../store/CrmContext';
import { useToast } from '../store/ToastContext';
import { CUSTOMER_STATUSES } from '../types/customer';

function StatCard({ icon, label, value, hint }: { icon: IconName; label: string; value: string; hint?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-card__icon"><Icon name={icon} /></span>
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {hint && <p className="stat-card__hint">{hint}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t, formatNumber, formatCurrency, formatPercent, formatRelative } = useI18n();
  const { customers, activity, loadSampleData } = useCrm();
  const { notify } = useToast();
  const stats = useMemo(() => computeStats(customers), [customers]);

  const recent = useMemo(
    () => [...customers].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [customers],
  );

  if (customers.length === 0) {
    return (
      <>
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
        <EmptyState icon="users" title={t('dashboard.empty.title')} body={t('dashboard.empty.body')}>
          <a className="btn btn--primary" href={paths.customerNew()}>
            <Icon name="plus" /> {t('dashboard.empty.add')}
          </a>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              loadSampleData();
              notify('success', 'toast.dataReset');
            }}
          >
            <Icon name="refresh" /> {t('dashboard.empty.sample')}
          </button>
        </EmptyState>
      </>
    );
  }

  const share = (n: number) => (stats.total ? n / stats.total : 0);

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <a className="btn btn--primary" href={paths.customerNew()}>
            <Icon name="plus" /> {t('customers.add')}
          </a>
        }
      />

      <section className="stats-grid" aria-label={t('dashboard.title')}>
        <StatCard
          icon="users"
          label={t('dashboard.stats.total')}
          value={formatNumber(stats.total)}
          hint={t('dashboard.stats.newThisMonth', { count: formatNumber(stats.newThisMonth) })}
        />
        <StatCard
          icon="userCheck"
          label={t('dashboard.stats.active')}
          value={formatNumber(stats.byStatus.active)}
          hint={t('dashboard.stats.ofTotal', { percent: formatPercent(share(stats.byStatus.active)) })}
        />
        <StatCard
          icon="target"
          label={t('dashboard.stats.pipeline')}
          value={formatCurrency(stats.openPipelineValue)}
          hint={`${t('dashboard.stats.leads')}: ${formatNumber(stats.byStatus.lead + stats.byStatus.prospect)}`}
        />
        <StatCard icon="wallet" label={t('dashboard.stats.activeValue')} value={formatCurrency(stats.activeValue)} />
      </section>

      <div className="dashboard-grid">
        <section className="card" aria-labelledby="breakdown-title">
          <h2 id="breakdown-title" className="card__title">{t('dashboard.breakdown')}</h2>
          <ul className="breakdown">
            {CUSTOMER_STATUSES.map((status) => (
              <li key={status} className="breakdown__row">
                <div className="breakdown__label">
                  <StatusBadge status={status} />
                  <span className="breakdown__count">
                    {formatNumber(stats.byStatus[status])} · {formatPercent(share(stats.byStatus[status]))}
                  </span>
                </div>
                <div className="breakdown__track" aria-hidden="true">
                  <span className={`breakdown__bar breakdown__bar--${status}`} style={{ inlineSize: `${share(stats.byStatus[status]) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="recent-title">
          <div className="card__header">
            <h2 id="recent-title" className="card__title">{t('dashboard.recentCustomers')}</h2>
            <a className="link-btn" href={paths.customers()}>
              {t('dashboard.viewAll')} <Icon name="chevronForward" size={16} />
            </a>
          </div>
          <ul className="mini-list">
            {recent.map((c) => (
              <li key={c.id}>
                <a className="mini-list__item" href={paths.customer(c.id)}>
                  <span className="avatar" aria-hidden="true">{initials(c.name)}</span>
                  <span className="mini-list__text">
                    <span className="mini-list__name">{c.name}</span>
                    <span className="mini-list__meta">{c.company || c.city || '—'} · {formatRelative(c.updatedAt)}</span>
                  </span>
                  <StatusBadge status={c.status} />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="card dashboard-grid__wide" aria-labelledby="activity-title">
          <h2 id="activity-title" className="card__title">{t('dashboard.recentActivity')}</h2>
          {activity.length === 0 ? (
            <p className="muted">{t('dashboard.noActivity')}</p>
          ) : (
            <ul className="timeline">
              {activity.slice(0, 8).map((a) => <ActivityItem key={a.id} activity={a} link />)}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
