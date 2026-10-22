import { expect, test, type Page } from '@playwright/test';

type Lang = 'en' | 'ar';

/** Seeds the language preference before the very first load only (later reloads keep the user's choice). */
async function startIn(page: Page, lang: Lang, hash = '#/') {
  await page.addInitScript((l) => {
    if (!localStorage.getItem('clientflow.language')) localStorage.setItem('clientflow.language', l);
  }, lang);
  await page.goto(hash);
  await expect(page.locator('html')).toHaveAttribute('lang', lang);
}

async function go(page: Page, hash: string) {
  await page.evaluate((h) => { window.location.hash = h; }, hash);
}

const T = {
  en: {
    switchTo: 'Switch language to العربية',
    dashboard: 'Dashboard',
    customers: 'Customers',
    addCustomer: 'Add customer',
    submitAdd: 'Add customer',
    name: /Full name/,
    email: /Email/,
    phone: /Phone/,
    city: /City/,
    value: /Deal value/,
    nameRequired: 'Enter the customer’s name.',
    emailInvalid: 'Enter a valid email address, like name@example.com.',
    added: (n: string) => `${n} was added.`,
    edit: 'Edit',
    save: 'Save changes',
    delete: 'Delete',
    search: 'Search customers',
    changeStatus: (n: string) => `Change status for ${n}`,
    active: 'Active',
    statusToast: (n: string) => `${n} is now Active.`,
    newNote: 'New note',
    addNote: 'Add note',
    noteRequired: 'Write something before saving the note.',
    editNote: 'Edit note',
    saveNote: 'Save note',
    deleteNote: 'Delete note',
    deleteDialog: 'Delete customer?',
    deleted: (n: string) => `${n} was deleted.`,
    noResults: 'No matching customers',
  },
  ar: {
    switchTo: 'تغيير اللغة إلى English',
    dashboard: 'لوحة التحكم',
    customers: 'العملاء',
    addCustomer: 'إضافة عميل',
    submitAdd: 'إضافة العميل',
    name: /الاسم الكامل/,
    email: /البريد الإلكتروني/,
    phone: /رقم الجوال/,
    city: /المدينة/,
    value: /قيمة الصفقة/,
    nameRequired: 'أدخل اسم العميل.',
    emailInvalid: 'أدخل بريدًا إلكترونيًا صحيحًا، مثل name@example.com.',
    added: (n: string) => `تمت إضافة ${n}.`,
    edit: 'تعديل',
    save: 'حفظ التغييرات',
    delete: 'حذف',
    search: 'البحث في العملاء',
    changeStatus: (n: string) => `تغيير حالة ${n}`,
    active: 'نشط',
    statusToast: (n: string) => `أصبحت حالة ${n}: نشط.`,
    newNote: 'ملاحظة جديدة',
    addNote: 'إضافة ملاحظة',
    noteRequired: 'اكتب نص الملاحظة قبل الحفظ.',
    editNote: 'تعديل الملاحظة',
    saveNote: 'حفظ الملاحظة',
    deleteNote: 'حذف الملاحظة',
    deleteDialog: 'حذف العميل؟',
    deleted: (n: string) => `تم حذف ${n}.`,
    noResults: 'لا يوجد عملاء مطابقون',
  },
} as const;

test.describe('language switching', () => {
  test('switches direction, updates <html>, and persists after reload', async ({ page }) => {
    await startIn(page, 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1, name: T.en.dashboard })).toBeVisible();

    await page.getByRole('button', { name: T.en.switchTo }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1, name: T.ar.dashboard })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('clientflow.language'))).toBe('ar');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1, name: T.ar.dashboard })).toBeVisible();

    await page.getByRole('button', { name: T.ar.switchTo }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('switcher is keyboard operable', async ({ page }) => {
    await startIn(page, 'en');
    await page.getByRole('button', { name: T.en.switchTo }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await page.keyboard.press('Space');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('unsaved form values and validation survive a language switch', async ({ page }) => {
    await startIn(page, 'en', '#/customers/new');
    await page.getByLabel(T.en.name).fill('Draft Person');
    await page.getByLabel(T.en.email).fill('not-an-email');
    await page.getByLabel(T.en.city).fill('Riyadh');
    await page.getByRole('button', { name: T.en.submitAdd }).click();
    await expect(page.getByText(T.en.emailInvalid)).toBeVisible();

    await page.getByRole('button', { name: T.en.switchTo }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByLabel(T.ar.name)).toHaveValue('Draft Person');
    await expect(page.getByLabel(T.ar.email)).toHaveValue('not-an-email');
    await expect(page.getByLabel(T.ar.city)).toHaveValue('Riyadh');
    // The validation message is re-rendered in Arabic, not lost.
    await expect(page.getByText(T.ar.emailInvalid)).toBeVisible();

    await page.getByRole('button', { name: T.ar.switchTo }).click();
    await expect(page.getByLabel(T.en.name)).toHaveValue('Draft Person');
    await expect(page.getByText(T.en.emailInvalid)).toBeVisible();
  });

  test('a half-written note survives a language switch', async ({ page }) => {
    await startIn(page, 'ar', '#/customers');
    await page.locator('[data-testid="customer-row"] a.person').first().click();
    await page.getByLabel(T.ar.newNote).fill('مسودة ملاحظة');
    await page.getByRole('button', { name: T.ar.switchTo }).click();
    await expect(page.getByLabel(T.en.newNote)).toHaveValue('مسودة ملاحظة');
  });
});

for (const lang of ['en', 'ar'] as const) {
  const t = T[lang];

  test.describe(`customer CRUD in ${lang}`, () => {
    test('create, search, change status, edit, notes, delete, persistence', async ({ page }) => {
      const name = lang === 'ar' ? 'منى الزهراني' : 'Mona Zahrani';
      const renamed = lang === 'ar' ? 'منى الزهراني المعدّلة' : 'Mona Zahrani Edited';
      await startIn(page, lang, '#/customers/new');

      // Validation errors in the active language.
      await page.getByRole('button', { name: t.submitAdd }).click();
      await expect(page.getByText(t.nameRequired)).toBeVisible();
      await expect(page.getByLabel(t.name)).toBeFocused();

      // Create (Arabic-Indic digits are accepted in phone and value).
      await page.getByLabel(t.name).fill(name);
      await page.getByLabel(t.email).fill(`mona.${lang}@example.com`);
      await page.getByLabel(t.phone).fill(lang === 'ar' ? '٠٥٠١٢٣٤٥٦٧' : '0501234567');
      await page.getByLabel(t.value).fill(lang === 'ar' ? '٤٥٠٠٠' : '45000');
      await page.getByRole('button', { name: t.submitAdd }).click();
      await expect(page.getByText(t.added(name))).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
      await expect(page.getByText('0501234567')).toBeVisible();

      // Search from the list, then change status inline.
      await go(page, '#/customers');
      await page.getByLabel(t.search).fill(name.split(' ')[0]);
      await expect(page.getByTestId('customer-row')).toHaveCount(1);
      await page.getByLabel(t.changeStatus(name)).selectOption('active');
      await expect(page.getByText(t.statusToast(name))).toBeVisible();

      await page.getByLabel(t.search).fill('zzz-no-match');
      await expect(page.getByText(t.noResults)).toBeVisible();
      await page.getByLabel(t.search).fill('');

      // Edit.
      await go(page, '#/customers');
      await page.getByRole('link', { name: lang === 'ar' ? `تعديل ${name}` : `Edit ${name}` }).click();
      await page.getByLabel(t.name).fill(renamed);
      await page.getByRole('button', { name: t.save }).click();
      await expect(page.getByRole('heading', { level: 1, name: renamed })).toBeVisible();

      // Notes: validation, add, edit, delete.
      await page.getByRole('button', { name: t.addNote }).click();
      await expect(page.getByText(t.noteRequired)).toBeVisible();
      await page.getByLabel(t.newNote).fill('First call done');
      await page.getByRole('button', { name: t.addNote }).click();
      await expect(page.getByTestId('note')).toHaveCount(1);
      await page.getByRole('button', { name: t.editNote }).click();
      await page.getByLabel(t.editNote).fill('First call done — send quote');
      await page.getByRole('button', { name: t.saveNote }).click();
      await expect(page.getByTestId('note')).toContainText('send quote');

      // Persistence across reload.
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: renamed })).toBeVisible();
      await expect(page.getByTestId('note')).toContainText('send quote');

      await page.getByRole('button', { name: t.deleteNote }).click();
      await page.getByRole('dialog').getByRole('button', { name: t.delete }).click();
      await expect(page.getByTestId('note')).toHaveCount(0);

      // Delete customer via confirmation dialog.
      await page.getByRole('button', { name: t.delete, exact: true }).click();
      await expect(page.getByRole('dialog', { name: t.deleteDialog })).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: t.delete }).click();
      await expect(page.getByText(t.deleted(renamed))).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await page.reload();
      await page.getByLabel(t.search).fill(renamed);
      await expect(page.getByTestId('customer-row')).toHaveCount(0);
    });
  });
}

test('status filter narrows the list and records survive switching language', async ({ page }) => {
  await startIn(page, 'en', '#/customers');
  await expect(page.getByTestId('customer-row').first()).toBeVisible();
  const total = await page.getByTestId('customer-row').count();
  expect(total).toBeGreaterThan(0);
  await page.getByLabel('Filter by status').selectOption('active');
  const active = await page.getByTestId('customer-row').count();
  expect(active).toBeLessThan(total);
  await page.getByRole('button', { name: T.en.switchTo }).click();
  // Same filter, same rows, translated UI.
  await expect(page.getByTestId('customer-row')).toHaveCount(active);
  await expect(page.getByLabel('تصفية حسب الحالة')).toHaveValue('active');
});

test('Escape closes the confirmation dialog without deleting', async ({ page }) => {
  await startIn(page, 'ar', '#/customers');
  await expect(page.getByTestId('customer-row').first()).toBeVisible();
  const before = await page.getByTestId('customer-row').count();
  await page.getByTestId('customer-row').first().getByRole('button', { name: /^حذف/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByTestId('customer-row')).toHaveCount(before);
});

test('Arabic pages contain no stray English UI text', async ({ page }) => {
  // Allowed Latin text: brand name, emails/domains, phone placeholders, format examples.
  const allowed = /^(ClientFlow|CRM|JSON|localStorage|example|com|name|company|XXXXXXXX|05XXXXXXXX|\+9665XXXXXXXX|English)$/i;
  await startIn(page, 'ar');
  for (const hash of ['#/', '#/customers', '#/customers/new', '#/settings', '#/nope']) {
    await go(page, hash);
    await page.waitForTimeout(300);
    // Walk visible text nodes, skipping user data that is inherently LTR (emails, phones in <bdi>).
    const text = await page.evaluate(() => {
      const out: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || parent.closest('bdi, noscript, script, style, [aria-hidden="true"]')) continue;
        if (!parent.checkVisibility()) continue;
        out.push(node.textContent ?? '');
      }
      return out.join('\n');
    });
    const latinWords = (text.match(/[A-Za-z][A-Za-z.+@-]{2,}/g) ?? [])
      .flatMap((w) => w.split(/[.@]/))
      .filter((w) => w.length > 2 && !allowed.test(w));
    expect(latinWords, `untranslated text on ${hash}`).toEqual([]);
  }
});

test('mobile drawer opens from the inline-start side in both directions', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'drawer only exists on small screens');
  await startIn(page, 'en');
  const width = page.viewportSize()!.width;

  await page.getByRole('button', { name: 'Open menu' }).click();
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).toBeVisible();
  await page.waitForTimeout(350);
  let box = (await page.locator('#sidebar').boundingBox())!;
  expect(box.x).toBeLessThan(5); // left edge in LTR
  await nav.getByRole('link', { name: 'Customers' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Customers' })).toBeVisible();
  await expect(nav).toBeHidden();

  await page.getByRole('button', { name: T.en.switchTo }).click();
  await page.getByRole('button', { name: 'فتح القائمة' }).click();
  await page.waitForTimeout(350);
  box = (await page.locator('#sidebar').boundingBox())!;
  expect(Math.round(box.x + box.width)).toBeGreaterThanOrEqual(width - 5); // right edge in RTL
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeHidden();
});

for (const lang of ['en', 'ar'] as const) {
  test(`no horizontal page overflow (${lang})`, async ({ page }) => {
    await startIn(page, lang);
    for (const hash of ['#/', '#/customers', '#/customers/new', '#/settings']) {
      await go(page, hash);
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${lang} ${hash}`).toBeLessThanOrEqual(0);
    }
  });
}
