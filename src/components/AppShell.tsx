import { useEffect, useState, type ReactNode } from 'react';
import { paths, type Route } from '../hooks/useHashRoute';
import { useI18n, type TranslationKey } from '../i18n';
import { useCrm } from '../store/CrmContext';
import { Icon, type IconName } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Toasts } from './Toasts';

const NAV: { key: TranslationKey; href: string; icon: IconName; match: Route['name'][] }[] = [
  { key: 'nav.dashboard', href: paths.dashboard(), icon: 'dashboard', match: ['dashboard'] },
  { key: 'nav.customers', href: paths.customers(), icon: 'users', match: ['customers', 'customerNew', 'customerDetail', 'customerEdit'] },
  { key: 'nav.settings', href: paths.settings(), icon: 'settings', match: ['settings'] },
];

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const { t } = useI18n();
  const { loadFailed, dismissLoadError } = useCrm();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer on navigation and on Escape.
  useEffect(() => setMenuOpen(false), [route]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t('app.skipToContent')}
      </a>

      <aside id="sidebar" className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <span className="brand-mark" aria-hidden="true">CF</span>
          <div>
            <p className="brand-name">{t('app.name')}</p>
            <p className="brand-tagline">{t('app.tagline')}</p>
          </div>
          <button type="button" className="icon-btn sidebar__close" onClick={() => setMenuOpen(false)} aria-label={t('nav.closeMenu')}>
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label={t('nav.main')}>
          <ul className="nav-list">
            {NAV.map((item) => {
              const active = item.match.includes(route.name);
              return (
                <li key={item.key}>
                  <a href={item.href} className={`nav-link${active ? ' nav-link--active' : ''}`} aria-current={active ? 'page' : undefined}>
                    <Icon name={item.icon} />
                    <span>{t(item.key)}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="sidebar__note">{t('footer.note')}</p>
      </aside>
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="shell__main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn topbar__menu"
            onClick={() => setMenuOpen(true)}
            aria-label={t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="sidebar"
          >
            <Icon name="menu" />
          </button>
          <span className="topbar__title">{t('app.name')}</span>
          <div className="topbar__actions">
            <LanguageSwitcher />
          </div>
        </header>

        {loadFailed && (
          <div className="banner banner--error" role="alert">
            <Icon name="alert" />
            <p>{t('error.storageCorrupt')}</p>
            <button type="button" className="icon-btn" onClick={dismissLoadError} aria-label={t('common.dismiss')}>
              <Icon name="close" size={16} />
            </button>
          </div>
        )}

        <main id="main" tabIndex={-1} className="content">
          {children}
        </main>

        <footer className="footer">
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <span>{t('footer.note')}</span>
        </footer>
      </div>

      <Toasts />
    </div>
  );
}
