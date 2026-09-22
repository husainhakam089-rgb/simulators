// قاعدة بيانات محلية على الجهاز (IndexedDB) — تعمل بلا إنترنت.

const DB_NAME = 'albaraka';
const DB_VERSION = 1;

/** @type {IDBDatabase|null} */
let _db = null;

export function open() {
  if (_db) return Promise.resolve(_db);
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
  });
}

function tx(store, mode) {
  return open().then((db) => db.transaction(store, mode).objectStore(store));
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put(store, value) {
  const s = await tx(store, 'readwrite');
  await wrap(s.put(value));
  return value;
}

export async function get(store, key) {
  const s = await tx(store, 'readonly');
  return wrap(s.get(key));
}

export async function all(store) {
  const s = await tx(store, 'readonly');
  return wrap(s.getAll());
}

export async function remove(store, key) {
  const s = await tx(store, 'readwrite');
  return wrap(s.delete(key));
}

export async function clear(store) {
  const s = await tx(store, 'readwrite');
  return wrap(s.clear());
}

export async function count(store) {
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
