// مخزن محلي (IndexedDB): طابور التسجيل دون اتصال + نسخة من كتالوج الأصناف.
const DB_NAME = "expiry-tracker";
const DB_VERSION = 1;

export interface QueuedBatch {
  id: string;               // client_id — يمنع التكرار عند إعادة الإرسال
  barcode: string;
  expiry_date: string;      // YYYY-MM-DD
  quantity: number;
  date_source: "ocr" | "calculated" | "manual";
  confidence: "high" | "low";
  received_at: string;
  product_name: string | null;
  photo?: Blob;
  tries: number;
  error?: string;
}

export interface CatalogItem {
  barcode: string;
  name: string;
  category_name: string | null;
  default_shelf_life_days: number | null;
  alert_before_days: number;
  is_perishable: boolean;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue", { keyPath: "id" });
      if (!db.objectStoreNames.contains("catalog")) db.createObjectStore("catalog", { keyPath: "barcode" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ------------------------------------------------------------- الطابور
export const queue = {
  add: (item: QueuedBatch) => tx("queue", "readwrite", (s) => s.put(item)),
  all: () => tx<QueuedBatch[]>("queue", "readonly", (s) => s.getAll()),
  remove: (id: string) => tx("queue", "readwrite", (s) => s.delete(id)),
  count: () => tx<number>("queue", "readonly", (s) => s.count()),
};

// ------------------------------------------------------------ الكتالوج
export const catalog = {
  get: (barcode: string) => tx<CatalogItem | undefined>("catalog", "readonly", (s) => s.get(barcode)),
  count: () => tx<number>("catalog", "readonly", (s) => s.count()),
  async replaceAll(items: CatalogItem[]) {
    const db = await open();
    return new Promise<void>((resolve, reject) => {
      const t = db.transaction("catalog", "readwrite");
      const store = t.objectStore("catalog");
      store.clear();
      for (const it of items) store.put(it);
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  },
};

export const meta = {
  get: <T,>(key: string) => tx<T | undefined>("meta", "readonly", (s) => s.get(key)),
  set: (key: string, value: unknown) => tx("meta", "readwrite", (s) => s.put(value, key)),
};

export function newClientId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
