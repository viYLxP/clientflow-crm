import { Suspense, lazy, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Spinner } from './components/ui';
import { useHashRoute, type Route } from './hooks/useHashRoute';
import { LanguageProvider, useI18n } from './i18n';
import { CrmProvider } from './store/CrmContext';
import { ToastProvider } from './store/ToastContext';

// Pages are code-split; the Suspense fallback is a real loading state while a chunk downloads.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));
const CustomerFormPage = lazy(() => import('./pages/CustomerFormPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function renderRoute(route: Route) {
  switch (route.name) {
    case 'dashboard':
      return <DashboardPage />;
    case 'customers':
      return <CustomersPage />;
    case 'customerNew':
      return <CustomerFormPage />;
    case 'customerEdit':
      return <CustomerFormPage id={route.id} />;
    case 'customerDetail':
      return <CustomerDetailPage id={route.id} />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <NotFoundPage />;
  }
}

/** Unique per page (never per language), so a language switch does not remount the page. */
function routeKey(route: Route) {
  return 'id' in route ? `${route.name}:${route.id}` : route.name;
}

function Routes() {
  const { t } = useI18n();
  const route = useHashRoute();
  const key = routeKey(route);

  // On navigation: scroll to top and move focus to the page heading for screen readers.
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = window.setTimeout(() => document.getElementById('page-title')?.focus({ preventScroll: true }), 50);
    return () => window.clearTimeout(timer);
  }, [key]);

  return (
    <AppShell route={route}>
      <ErrorBoundary key={key}>
        <Suspense fallback={<Spinner label={t('common.loading')} />}>
          <div key={key} className="page">{renderRoute(route)}</div>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <ToastProvider>
          <CrmProvider>
            <Routes />
          </CrmProvider>
        </ToastProvider>
      </ErrorBoundary>
    </LanguageProvider>
  );
}
