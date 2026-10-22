import type { Language } from '../i18n';
import type { Activity, CrmData, Customer, CustomerStatus } from '../types/customer';
import { createId } from './text';

// Fictional demo records. Customer data is user content, so it is seeded once in the
// language active at the time and is not translated when the interface language changes.
interface SampleRow {
  name: Record<Language, string>;
  company: Record<Language, string>;
  city: Record<Language, string>;
  email: string;
  phone: string;
  status: CustomerStatus;
  value: number;
  daysAgo: number;
  notes: Record<Language, string>[];
}

const ROWS: SampleRow[] = [
  {
    name: { en: 'Sara Al-Qahtani', ar: 'سارة القحطاني' },
    company: { en: 'Najd Logistics', ar: 'نجد للخدمات اللوجستية' },
    city: { en: 'Riyadh', ar: 'الرياض' },
    email: 'sara@najd-logistics.example',
    phone: '0501234567',
    status: 'active',
    value: 85000,
    daysAgo: 2,
    notes: [
      { en: 'Renewed annual fleet-tracking contract. Wants a quarterly review call.', ar: 'جدّدت عقد تتبع الأسطول السنوي، وتطلب اجتماع مراجعة كل ربع سنة.' },
    ],
  },
  {
    name: { en: 'Fahad Al-Otaibi', ar: 'فهد العتيبي' },
    company: { en: 'Red Sea Hospitality', ar: 'البحر الأحمر للضيافة' },
    city: { en: 'Jeddah', ar: 'جدة' },
    email: 'fahad@redsea-hospitality.example',
    phone: '+966551112233',
    status: 'prospect',
    value: 120000,
    daysAgo: 5,
    notes: [
      { en: 'Requested a proposal for booking-system integration. Follow up Sunday.', ar: 'طلب عرضًا لربط نظام الحجوزات. المتابعة يوم الأحد.' },
      { en: 'Decision maker is the operations director.', ar: 'صاحب القرار هو مدير العمليات.' },
    ],
  },
  {
    name: { en: 'Noura Al-Shehri', ar: 'نورة الشهري' },
    company: { en: 'Asir Coffee Roasters', ar: 'محمصة عسير للقهوة' },
    city: { en: 'Abha', ar: 'أبها' },
    email: 'noura@asircoffee.example',
    phone: '0539876543',
    status: 'lead',
    value: 18000,
    daysAgo: 1,
    notes: [],
  },
  {
    name: { en: 'Abdullah Al-Harbi', ar: 'عبدالله الحربي' },
    company: { en: 'Eastern Steel Works', ar: 'مصانع الشرقية للحديد' },
    city: { en: 'Dammam', ar: 'الدمام' },
    email: 'a.harbi@easternsteel.example',
    phone: '0567788990',
    status: 'active',
    value: 240000,
    daysAgo: 40,
    notes: [
      { en: 'Onboarded 12 users. Asked for Arabic invoices.', ar: 'تم تفعيل 12 مستخدمًا. طلب فواتير باللغة العربية.' },
    ],
  },
  {
    name: { en: 'Reem Al-Dosari', ar: 'ريم الدوسري' },
    company: { en: 'Bloom Dental Clinics', ar: 'عيادات بلوم لطب الأسنان' },
    city: { en: 'Riyadh', ar: 'الرياض' },
    email: 'reem@bloomdental.example',
    phone: '',
    status: 'lead',
    value: 32000,
    daysAgo: 9,
    notes: [],
  },
  {
    name: { en: 'Khalid Al-Ghamdi', ar: 'خالد الغامدي' },
    company: { en: 'Hejaz Real Estate', ar: 'الحجاز للتطوير العقاري' },
    city: { en: 'Makkah', ar: 'مكة المكرمة' },
    email: '',
    phone: '0545566778',
    status: 'inactive',
    value: 0,
    daysAgo: 75,
    notes: [
      { en: 'Paused the project until next fiscal year.', ar: 'أوقف المشروع حتى السنة المالية القادمة.' },
    ],
  },
  {
    name: { en: 'Lama Al-Mutairi', ar: 'لمى المطيري' },
    company: { en: 'Qassim Dates Co.', ar: 'شركة تمور القصيم' },
    city: { en: 'Buraydah', ar: 'بريدة' },
    email: 'lama@qassimdates.example',
    phone: '0598765432',
    status: 'prospect',
    value: 56000,
    daysAgo: 14,
    notes: [],
  },
];

const DAY = 24 * 60 * 60 * 1000;

export function createSampleData(language: Language, now = Date.now()): CrmData {
  const customers: Customer[] = [];
  const activity: Activity[] = [];

  for (const row of ROWS) {
    const created = new Date(now - row.daysAgo * DAY).toISOString();
    const id = createId();
    const name = row.name[language];
    const notes = row.notes.map((note, index) => ({
      id: createId(),
      body: note[language],
      createdAt: new Date(now - row.daysAgo * DAY + (index + 1) * 60 * 60 * 1000).toISOString(),
    }));
    const updated = notes.length > 0 ? notes[notes.length - 1].createdAt : created;
    customers.push({
      id,
      name,
      company: row.company[language],
      email: row.email,
      phone: row.phone,
      city: row.city[language],
      status: row.status,
      value: row.value,
      notes,
      createdAt: created,
      updatedAt: updated,
    });
    activity.push({ id: createId(), type: 'created', customerId: id, customerName: name, at: created });
    for (const note of notes) {
      activity.push({ id: createId(), type: 'note', customerId: id, customerName: name, at: note.createdAt });
    }
  }

  activity.sort((a, b) => b.at.localeCompare(a.at));
  return { customers, activity };
}
