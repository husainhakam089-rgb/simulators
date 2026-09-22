// قاعدة بيانات محلية على الجهاز (IndexedDB) — تعمل بلا إنترنت.

const DB_NAME = 'albaraka';
const DB_VERSION = 1;
const STORES = ['contracts', 'receipts', 'customers', 'lists', 'settings'];
const KEY_PATHS = { contracts: 'id', receipts: 'id', customers: 'id', lists: 'key', settings: 'key' };

/** @type {IDBDatabase|null} */
let _db = null;

export function open() {
  if (_db) return Promise.resolve(_db);
  if (fallback.active) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains('contracts')) {
        const s = db.createObjectStore('contracts', { keyPath: 'id' });
        s.createIndex('number', 'number', { unique: false });
        s.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('receipts')) {
        const s = db.createObjectStore('receipts', { keyPath: 'id' });
        s.createIndex('number', 'number', { unique: false });
        s.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('customers')) {
        const s = db.createObjectStore('customers', { keyPath: 'id' });
        s.createIndex('name', 'name', { unique: false });
      }
      // القوائم: سجل واحد لكل قائمة، يحمل عناصرها وعدد استعمال كل عنصر.
      if (!db.objectStoreNames.contains('lists')) {
        db.createObjectStore('lists', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      void e;
    };
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  }).catch((err) => {
    // فتح الملف مباشرة من القرص (file://) يمنع IndexedDB في بعض المتصفحات،
    // فيُستعمل تخزين المتصفح البسيط بدلاً منه حتى لا يتوقف التطبيق.
    fallback.enable(err);
    return null;
  });
}

/* ---------- تخزين بديل عند تعذّر IndexedDB ---------- */

const fallback = {
  active: false,
  data: null,
  enable(err) {
    if (this.active) return;
    this.active = true;
    try {
      this.data = JSON.parse(localStorage.getItem('albaraka-store') || '{}');
    } catch {
      this.data = {};
    }
    for (const s of STORES) if (!this.data[s]) this.data[s] = {};
    console.warn('IndexedDB غير متاح، التخزين البديل مفعّل:', err && err.message);
  },
  flush() {
    try {
      localStorage.setItem('albaraka-store', JSON.stringify(this.data));
    } catch (e) {
      console.error('تعذّر الحفظ في تخزين المتصفح:', e);
      throw new Error('امتلأت مساحة التخزين — صدّر نسخة احتياطية ثم احذف عقوداً قديمة');
    }
  },
  store(name) {
    if (!this.data[name]) this.data[name] = {};
    return this.data[name];
  },
};

function tx(store, mode) {
  return open().then((db) => db.transaction(store, mode).objectStore(store));
}

/** هل يعمل التطبيق على التخزين البديل؟ */
export function usingFallback() {
  return fallback.active;
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put(store, value) {
  await open();
  if (fallback.active) {
    fallback.store(store)[value[KEY_PATHS[store]]] = value;
    fallback.flush();
    return value;
  }
  const s = await tx(store, 'readwrite');
  await wrap(s.put(value));
  return value;
}

export async function get(store, key) {
  await open();
  if (fallback.active) return fallback.store(store)[key];
  const s = await tx(store, 'readonly');
  return wrap(s.get(key));
}

export async function all(store) {
  await open();
  if (fallback.active) return Object.values(fallback.store(store));
  const s = await tx(store, 'readonly');
  return wrap(s.getAll());
}

export async function remove(store, key) {
  await open();
  if (fallback.active) {
    delete fallback.store(store)[key];
    fallback.flush();
    return undefined;
  }
  const s = await tx(store, 'readwrite');
  return wrap(s.delete(key));
}

export async function clear(store) {
  await open();
  if (fallback.active) {
    fallback.data[store] = {};
    fallback.flush();
    return undefined;
  }
  const s = await tx(store, 'readwrite');
  return wrap(s.clear());
}

export async function count(store) {
  await open();
  if (fallback.active) return Object.keys(fallback.store(store)).length;
  const s = await tx(store, 'readonly');
  return wrap(s.count());
}

/** حذف قاعدة البيانات بالكامل — للاختبار فقط. */
export function destroy() {
  if (_db) {
    _db.close();
    _db = null;
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
