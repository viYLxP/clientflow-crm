import { useEffect, useState } from 'react';

// Hash routing keeps the app deployable on static hosts (GitHub Pages, Netlify, Vercel)
// without server rewrite rules, and avoids pulling in a router for six routes.
export type Route =
  | { name: 'dashboard' }
  | { name: 'customers' }
  | { name: 'customerNew' }
  | { name: 'customerDetail'; id: string }
  | { name: 'customerEdit'; id: string }
  | { name: 'settings' }
  | { name: 'notFound' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { name: 'dashboard' };
  if (parts[0] === 'customers') {
    if (parts.length === 1) return { name: 'customers' };
    if (parts.length === 2 && parts[1] === 'new') return { name: 'customerNew' };
    if (parts.length === 2) return { name: 'customerDetail', id: parts[1] };
    if (parts.length === 3 && parts[2] === 'edit') return { name: 'customerEdit', id: parts[1] };
  }
  if (parts.length === 1 && parts[0] === 'settings') return { name: 'settings' };
  return { name: 'notFound' };
}

export const paths = {
  dashboard: () => '#/',
  customers: () => '#/customers',
  customerNew: () => '#/customers/new',
  customer: (id: string) => `#/customers/${encodeURIComponent(id)}`,
  customerEdit: (id: string) => `#/customers/${encodeURIComponent(id)}/edit`,
  settings: () => '#/settings',
};

export function navigate(hash: string) {
  window.location.hash = hash;
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
