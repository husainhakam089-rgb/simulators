// رفع الوجبات المحفوظة محلياً عند عودة الاتصال.
import { supabase } from "./supabase";
import { queue, catalog, type QueuedBatch, type CatalogItem } from "./db";
import { readTextInCloud } from "./cloudOcr";
import { readDatesFromText } from "./dateParse";
import { matchProduct } from "./productMatch";

type Listener = (pending: number, syncing: boolean) => void;
const listeners = new Set<Listener>();
let syncing = false;

export function onSyncChange(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function notify() {
  const pending = await queue.count();
  listeners.forEach((l) => l(pending, syncing));
}

export async function enqueueBatch(item: QueuedBatch) {
  await queue.add(item);
  await notify();
  void syncNow();
}

async function uploadPhoto(storeId: string, item: QueuedBatch): Promise<string | null> {
  if (!item.photo) return null;
  const path = `${storeId}/${item.id}.jpg`;
  const { error } = await supabase.storage
    .from("batch-photos")
    .upload(path, item.photo, { contentType: "image/jpeg", upsert: true });
  if (error) return null;   // الصورة إثبات مساعد — لا تمنع حفظ الوجبة
  return path;
}

/**
 * قراءة متأخرة عند المزامنة.
 *
 * العامل قد يكون صوّر داخل المخزن بلا اتصال، فقرأ محرك الجهاز وحده أو لم يقرأ
 * شيئاً وبقي التاريخ محسوباً. الصورة محفوظة معنا، فحين يعود الاتصال نقرأها
 * سحابياً قبل الرفع. لا يمسّ هذا ما أدخله العامل بيده أبداً.
 */
async function reReadBeforeUpload(item: QueuedBatch): Promise<QueuedBatch> {
  const needsDate = item.date_source === "calculated";
  const needsProduct = !item.product_id;
  // مرة واحدة لكل وجبة: لو تعثّر الرفع بعدها فالمحاولة الثانية لا تُعيد الكلفة
  if (item.reread || !item.photo || (!needsDate && !needsProduct)) return item;

  const res = await readTextInCloud(item.photo);
  if (!res.ok) return item;

  const out = { ...item, reread: true };
  const notes = out.note ? [out.note] : [];

  if (needsDate) {
    const date = readDatesFromText(res.text, { ocrConfidence: 92 });
    // نفس قاعدة الشاشة: تاريخ غير واثق لا يُعتمد. تاريخ خاطئ أسوأ من محسوب.
    if (date.expiry && date.confidence === "high") {
      out.expiry_date = date.expiry;
      out.production_date = date.production ?? out.production_date ?? null;
      out.date_source = "ocr";
      out.read_expiry = date.expiry;
      out.read_engine = "cloud";
      notes.push(`قُرئ التاريخ عند المزامنة — ${date.reason}`);
    }
  }

  if (needsProduct) {
    const match = matchProduct(res.text, await catalog.all());
    if (match.confident && match.best) {
      const found = match.best.item as CatalogItem;
      out.product_id = found.product_id;
      out.product_name = found.name;
      out.identified_by = "name";
      out.read_product_id = found.product_id;
      notes.push("طوبق الصنف بالاسم عند المزامنة");
    }
  }

  out.note = notes.join(" — ") || null;
  return out;
}

export async function syncNow(): Promise<{ sent: number; failed: number }> {
  if (syncing || !navigator.onLine) return { sent: 0, failed: 0 };
  syncing = true;
  await notify();

  let sent = 0, failed = 0;
  try {
    const items = await queue.all();
    if (items.length === 0) return { sent, failed };

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return { sent, failed };
    const { data: storeId } = await supabase.rpc("current_store_id");

    for (const raw of items) {
      const item = await reReadBeforeUpload(raw).catch(() => raw);
      try {
        const photo_url = storeId ? await uploadPhoto(storeId as string, item) : null;
        const { error } = await supabase.rpc("record_batch", {
          p_client_id: item.id,
          p_barcode: item.barcode,
          p_expiry_date: item.expiry_date,
          p_quantity: item.quantity,
          p_production_date: item.production_date ?? null,
          p_date_source: item.date_source,
          p_confidence: item.confidence,
          p_photo_url: photo_url,
          p_note: item.note ?? null,
          p_received_at: item.received_at,
          p_product_id: item.product_id ?? null,
          p_identified_by: item.identified_by ?? null,
          p_read_expiry: item.read_expiry ?? null,
          p_read_engine: item.read_engine ?? null,
          p_read_product_id: item.read_product_id ?? null,
        });
        if (error) throw new Error(error.message);
        await queue.remove(item.id);
        sent++;
      } catch (e) {
        failed++;
        item.tries += 1;
        item.error = String(e);
        await queue.add(item);
      }
    }
  } finally {
    syncing = false;
    await notify();
  }
  return { sent, failed };
}

export async function refreshCatalog(): Promise<number> {
  if (!navigator.onLine) return catalog.count();
  const { data, error } = await supabase.rpc("worker_catalog");
  if (error || !data) return catalog.count();
  await catalog.replaceAll(data as CatalogItem[]);
  return (data as CatalogItem[]).length;
}

export function startAutoSync() {
  void syncNow();
  window.addEventListener("online", () => void syncNow());
  const timer = window.setInterval(() => void syncNow(), 30_000);
  return () => window.clearInterval(timer);
}

export { notify as notifySyncState };
