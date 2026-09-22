// القوائم القابلة للتوسّع: كل قائمة تكبر تلقائياً حسب شغل المعرض.

import * as db from './db.js';
import { normalizeAr, rankSimilar } from './util.js';

export const LIST_LABELS = {
  machineTypes: 'نوع الآلية',
  brands: 'الماركة',
  colors: 'اللون',
  governorates: 'المحافظة',
  offices: 'الدائرة',
  tools: 'الأدوات (للوصل)',
};

const DEFAULTS = {
  machineTypes: ['ترتكتر', 'حاصدة'],
  brands: ['ماسي فيركسون', 'جون دير', 'نيوهولاند', 'كيس', 'كوبوتا', 'دويتز فهر', 'لاندني', 'سام'],
  colors: ['أحمر', 'أزرق', 'أخضر', 'أصفر', 'أبيض', 'أسود', 'برتقالي', 'رمادي'],
  governorates: ['نينوى', 'أربيل', 'دهوك', 'كركوك', 'صلاح الدين', 'بغداد', 'الأنبار'],
  offices: ['مديرية أحوال نينوى', 'مديرية أحوال الموصل', 'مديرية أحوال تلكيف'],
  tools: ['سكة', 'دسك', 'ذراع شفل', 'دكاكة تبن', 'مقطورة', 'بذارة', 'مرشة', 'حاصدة أعلاف'],
};

/** أنواع الهوية ثابتة لأنها تقرّر أي الحقول تظهر. */
export const ID_TYPES = [
  { value: 'بطاقة وطنية', fields: ['idNumber'] },
  { value: 'هوية أحوال قديمة', fields: ['record', 'page'] },
];

const cache = new Map();

export async function seed() {
  for (const [key, values] of Object.entries(DEFAULTS)) {
    const existing = await db.get('lists', key);
    if (existing) continue;
    await db.put('lists', {
      key,
      items: values.map((value) => ({ value, count: 0, builtin: true })),
    });
  }
}

export async function getList(key) {
  if (cache.has(key)) return cache.get(key);
  const rec = (await db.get('lists', key)) || { key, items: [] };
  cache.set(key, rec);
  return rec;
}

/** العناصر مرتّبة: الأكثر استعمالاً أولاً. */
export async function items(key) {
  const rec = await getList(key);
  return [...rec.items].sort((a, b) => (b.count || 0) - (a.count || 0));
}

export async function values(key) {
  return (await items(key)).map((i) => i.value);
}

function findIndex(rec, value) {
  const n = normalizeAr(value);
  return rec.items.findIndex((i) => normalizeAr(i.value) === n);
}

/** إضافة عنصر للقائمة بشكل دائم. يتجاهل المكرّر (بعد التطبيع). */
export async function addItem(key, value) {
  const v = String(value || '').trim();
  if (!v) return false;
  const rec = await getList(key);
  if (findIndex(rec, v) >= 0) return false;
  rec.items.push({ value: v, count: 1, builtin: false });
  await db.put('lists', rec);
  cache.set(key, rec);
  return true;
}

/** رفع عدّاد الاستعمال — به تُرتَّب الكبسولات. */
export async function bump(key, value) {
  const rec = await getList(key);
  const i = findIndex(rec, value);
  if (i < 0) return;
  rec.items[i].count = (rec.items[i].count || 0) + 1;
  await db.put('lists', rec);
  cache.set(key, rec);
}

export async function removeItem(key, value) {
  const rec = await getList(key);
  const i = findIndex(rec, value);
  if (i < 0) return;
  rec.items.splice(i, 1);
  await db.put('lists', rec);
  cache.set(key, rec);
}

export async function renameItem(key, oldValue, newValue) {
  const rec = await getList(key);
  const i = findIndex(rec, oldValue);
  if (i < 0) return;
  rec.items[i].value = String(newValue).trim();
  await db.put('lists', rec);
  cache.set(key, rec);
}

/** هل القيمة موجودة أصلاً في القائمة؟ */
export async function has(key, value) {
  const rec = await getList(key);
  return findIndex(rec, value) >= 0;
}

/** اقتراح المتشابه: يكتب «ماسي» فيظهر «ماسي فيركسون». */
export async function similar(key, query, limit = 5) {
  const list = await values(key);
  return rankSimilar(query, list, { limit });
}

export function invalidate() {
  cache.clear();
}
