// دفتر الزبائن: يُبنى تلقائياً من العقود والوصولات، ويقترح البيانات كاملة.

import * as db from './db.js';
import { normalizeAr, rankSimilar, uid } from './util.js';

// يُخبَّأ الوعد لا الناتج: لو خُبِّئ الناتج بعد الانتظار، فنداءان متزامنان
// (حفظ البائع والمشتري معاً) يجلب كلٌّ منهما نسخة، فتضيع إضافة أحدهما.
let cachePromise = null;

export async function all() {
  if (!cachePromise) cachePromise = db.all('customers');
  return cachePromise;
}

/** بحث بالاسم — يُستعمل في اقتراح الزبون بعد أول حرفين. */
export async function search(query, limit = 6) {
  const list = await all();
  return rankSimilar(query, list, { key: 'name', limit, min: 0.4 });
}

/** حفظ/تحديث زبون. المطابقة بالاسم المطبَّع مع الموبايل إن وُجد. */
export async function upsert(party) {
  if (!party || !party.name) return null;
  const list = await all();
  const key = normalizeAr(party.name);
  const found = list.find(
    (c) => normalizeAr(c.name) === key && (!party.mobile || !c.mobile || c.mobile === party.mobile),
  );
  const rec = {
    id: found ? found.id : uid(),
    name: party.name.trim(),
    idType: party.idType || '',
    idNumber: party.idNumber || '',
    record: party.record || '',
    page: party.page || '',
    office: party.office || '',
    address: party.address || '',
    mobile: party.mobile || '',
    uses: (found && found.uses ? found.uses : 0) + 1,
    updatedAt: Date.now(),
  };
  await db.put('customers', rec);
  if (found) Object.assign(found, rec);
  else list.push(rec);
  return rec;
}

export function invalidate() {
  cachePromise = null;
}
