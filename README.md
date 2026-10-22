# ClientFlow CRM

A bilingual (Arabic / English) customer relationship management prototype built with **React 19, TypeScript and Vite**. It covers a dashboard, full customer CRUD, search and filtering, status management, notes and an activity log, with data persisted in the browser.

> **Prototype scope:** there is no backend. All data lives in the visitor's browser (`localStorage`). Nothing is sent to a server, and no API keys or secrets are used.

## Screenshots

| English dashboard | Arabic customer list (RTL) |
| --- | --- |
| ![English dashboard](docs/screenshots/desktop-en-dashboard.png) | ![Arabic customers](docs/screenshots/desktop-ar-customers.png) |
| **Arabic customer profile** | **Mobile (Arabic)** |
| ![Arabic detail](docs/screenshots/desktop-ar-detail.png) | ![Mobile Arabic](docs/screenshots/mobile-ar-customers.png) |

## Features

| Area | What it does |
| --- | --- |
| Dashboard | Total / active customers, open pipeline value (leads + prospects), active customer value, new this month, status breakdown, recently updated customers, recent activity |
| Customers | Create, view, edit and delete, with confirmation dialogs |
| Search & filters | Searches name, company, email, phone and city. Filter by status and city, and sort by updated, newest, oldest, name or value. Arabic search ignores diacritics and أ/إ/آ, ة/ه, ى/ي differences, and accepts Arabic-Indic digits |
| Status | Lead → Prospect → Active → Inactive. Change status inline from the table or the profile. Every change is logged |
| Notes | Add, edit and delete notes per customer, with validation and a character counter |
| Activity log | Created / updated / status / note / deleted events, stored as codes and rendered in the active language |
| Data tools | Export JSON backup, import (validated), load sample data, delete everything |
| Feedback | Inline validation with an error summary, toasts (polite for success, assertive for errors), empty states, page loading states (code-split routes), error boundary, storage-failure warnings |

## Bilingual implementation

- **Dictionaries:** `src/i18n/en.ts` defines every key, and `src/i18n/ar.ts` is typed as `Dictionary`, so a missing Arabic key **fails the build**. A unit test also checks that both languages use the same `{placeholders}` and that no Arabic entry is untranslated English.
- **Context:** `LanguageProvider` exposes `t()`, `language`, `dir`, `setLanguage`, `toggleLanguage` and locale-aware `formatNumber`, `formatCurrency` (SAR), `formatPercent`, `formatDate` and `formatRelative`.
- **Direction:** switching language updates `<html lang>` and `<html dir>`. An inline script in `index.html` applies the saved language before React loads, so the page never flashes in the wrong direction.
- **Persistence:** the choice is saved in `localStorage` (`clientflow.language`). On the first visit the app uses the browser language (Arabic if it starts with `ar`), otherwise English.
- **No lost work:** the language lives in context and pages are keyed by route, never by language. Switching therefore never remounts a page, and typed form values, half-written notes, filters and validation messages all survive (validation errors are stored as keys and re-translated).
- **Layout:** CSS logical properties (`margin-inline-start`, `inset-inline-end`, `text-align: start`, `inline-size`) are used throughout. Directional icons (back arrow, chevrons) mirror in RTL. The mobile drawer slides in from the inline-start edge, and select chevrons and the active-nav indicator also switch sides.
- **Inherently LTR values:** emails, phone numbers and numeric inputs are wrapped in `<bdi dir="ltr">` or use `dir="ltr"` inputs, so they stay readable inside Arabic text.
- **Fonts:** IBM Plex Sans Arabic for Arabic and Inter for Latin, with system fallbacks (Noto Sans Arabic, Segoe UI, Tahoma).
- **Locale formatting:** `en-US` and `ar-SA-u-ca-gregory-nu-latn` (Gregorian calendar, Latin digits, the common convention in Saudi business software). To use Hijri dates and Arabic-Indic digits instead, change `intlLocales` in `src/i18n/config.ts` to `'ar-SA'`.
- **Accessible switcher:** a real `<button>` whose visible label is the *target* language in its own script (`lang` attribute set). Its `aria-label` reads "Switch language to …", and it works with Enter and Space. Settings also offers a radio group.

Customer records are user data, so they are **not** translated. Sample data is seeded once, in whichever language is active on the first visit.

## Project structure

```
src/
  i18n/           en.ts, ar.ts, config.ts, LanguageContext.tsx, useI18n.ts
  store/          CrmContext.tsx (state + persistence), crmReducer.ts (pure), ToastContext.tsx
  lib/            validation.ts, customers.ts (filter/sort/stats), storage.ts, text.ts, sampleData.ts
  hooks/          useHashRoute.ts (6 routes, hash-based for static hosting)
  components/     AppShell, LanguageSwitcher, Icon, Toasts, ErrorBoundary, ActivityItem, ui.tsx
  pages/          Dashboard, Customers, CustomerDetail, CustomerForm, Settings, NotFound
  types/          customer.ts
tests/
  unit/           Vitest: dictionaries, validation, search/filter/stats, reducer, storage parsing
  e2e/            Playwright: language switching, persistence, CRUD in both languages, RTL drawer, overflow
```

Routes: `#/`, `#/customers`, `#/customers/new`, `#/customers/:id`, `#/customers/:id/edit`, `#/settings`. Hash routing means no server rewrite rules are needed on any static host.

## Getting started

Requirements: **Node.js 20.19+ or 22.12+** and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright; builds and serves the app automatically) |

First-time e2e setup: `npx playwright install chromium`. To use a Chromium you already have, set `CHROMIUM_PATH=/path/to/chromium`.

## Testing

What the automated suites cover:

- **Unit (22 tests):** Arabic and English have identical keys and placeholders, with no empty or untranslated Arabic strings. Covers validation (Saudi and international phones, Arabic-Indic digits, duplicate emails), Arabic-aware search, filters and sorting, dashboard math, the reducer (status, notes, delete) and import validation.
- **E2E, desktop 1280×800 and mobile Pixel 7:**
  - Switching sets `lang`/`dir` and persists after reload.
  - The switcher works by keyboard.
  - Unsaved form values and validation messages survive a switch, and so does a half-written note.
  - Full CRUD, notes, status changes, search and deletion work in **both** languages, including reload persistence.
  - The status filter survives a switch, and Escape cancels a delete dialog.
  - Arabic pages contain no stray English UI text.
  - The mobile drawer opens from the left in English and from the right in Arabic.
  - No page scrolls horizontally in either language.

## Publish to GitHub

```bash
git init
git add .
git commit -m "ClientFlow CRM: bilingual CRM prototype"
git branch -M main
# Create an empty repository named clientflow-crm on github.com first (no README), then:
git remote add origin https://github.com/<your-username>/clientflow-crm.git
git push -u origin main
```

## Deploy for free

The build is a static site (`dist/`). `vite.config.ts` uses `base: './'`, so the same build works at a domain root or under a sub-path.

### Option A: GitHub Pages (included workflow)

1. Push to GitHub as above.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. The included `.github/workflows/deploy.yml` lints, tests, builds and deploys on every push to `main`.
4. The site goes live at `https://<your-username>.github.io/clientflow-crm/`.

### Option B: Netlify

Go to **Add new site → Import from Git**, pick the repo and use build command `npm run build` with publish directory `dist`. No redirects are needed thanks to hash routing.

### Option C: Vercel

Go to **Add New → Project**, import the repo, and keep the Vite preset (build `npm run build`, output `dist`).

### Option D: Cloudflare Pages

Go to **Workers & Pages → Create → Pages → Connect to Git**, then set framework preset **Vite**, build `npm run build` and output `dist`.

## Taking it to production

This is deliberately a front-end prototype. A real deployment would add an API and database (e.g. Supabase, Firebase or a Node/.NET backend), authentication and roles, server-side validation, and audit logging. The reducer and `CrmContext` API are where a data layer would plug in.

## License

MIT. Replace this with your preferred license.
