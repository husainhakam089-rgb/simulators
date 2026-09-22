// إعدادات المعرض والطابعة والعدّاد.

import * as db from './db.js';

const KEY = 'app';

export const DEFAULT_CONDITIONS = [
  'شاهد المشتري الآلية وفحصها فحصاً كاملاً وقبلها بحالتها الراهنة، ولا يحق له الرجوع على البائع أو المعرض بأي عيب بعد توقيع هذا العقد.',
  'المعرض غير مسؤول عن أي مخالفات أو حجوزات أو ديون مترتّبة على الآلية قبل تاريخ هذا العقد، وهي من مسؤولية البائع.',
  'على المشتري إكمال معاملة نقل الملكية خلال مدة أقصاها ثلاثون يوماً من تاريخ العقد، وبعدها لا يتحمّل المعرض أي مسؤولية.',
];

export const DEFAULTS = {
  key: KEY,
  shopName: 'معرض البركة لتجارة السيارات الحديثة',
  manager: 'كرم حسين علي',
  address: 'موصل - الساحل الأيسر - مدينة المعارض',
  phones: '',
  // صور الرأس (data URL) — تُرفع من شاشة الإعدادات.
  logo: null,
  headerImageRight: null,
  headerImageLeft: null,
  // العدّادات: الرقم القادم.
  contractNext: 959,
  receiptNext: 1,
  // الطباعة
  printerMode: 'system', // system | direct
  printerAddress: '', // مثال: 192.168.1.50
  printerPort: 631,
  printerQueue: 'ipp/print',
  defaultContractCopies: ['buyer', 'seller', 'shop'],
  defaultReceiptCopies: ['buyer', 'shop'],
  receiptsPerPage: 2, // وصلان في الورقة الواحدة مع خط قص
  // نصوص العقد
  conditions: [...DEFAULT_CONDITIONS],
  subjectWord: 'الآلية', // قرار معلّق: «الآلية» أم «السيارة»
  engineNoRequired: false, // قرار معلّق: رقم المحرك إلزامي؟
  conditionsReviewed: false, // تُرفع بعد اعتماد نص الشروط الحقيقي من الدفتر
};

let cached = null;

export async function load() {
  if (cached) return cached;
  const stored = await db.get('settings', KEY);
  cached = { ...DEFAULTS, ...(stored || {}) };
  if (!Array.isArray(cached.conditions) || !cached.conditions.length) {
    cached.conditions = [...DEFAULT_CONDITIONS];
  }
  return cached;
}

export async function save(patch) {
  const current = await load();
  cached = { ...current, ...patch, key: KEY };
  await db.put('settings', cached);
  return cached;
}

export function current() {
  return cached || DEFAULTS;
}

/** حجز الرقم التالي وزيادة العدّاد. */
export async function takeNumber(kind) {
  const s = await load();
  const field = kind === 'receipt' ? 'receiptNext' : 'contractNext';
  const n = Number(s[field]) || 1;
  await save({ [field]: n + 1 });
  return n;
}

/** الرقم القادم دون حجزه — للعرض فقط. */
export async function peekNumber(kind) {
  const s = await load();
  return Number(kind === 'receipt' ? s.receiptNext : s.contractNext) || 1;
}

export function invalidate() {
  cached = null;
}
