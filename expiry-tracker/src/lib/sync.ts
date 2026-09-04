// رفع الوجبات المحفوظة محلياً عند عودة الاتصال.
import { supabase } from "./supabase";
import { queue, catalog, type QueuedBatch, type CatalogItem } from "./db";

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

    for (const item of items) {
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
