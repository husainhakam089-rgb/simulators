/* قاعدة بيانات محلية على الجهاز (IndexedDB) — لا تحتاج إنترنت.
   الواجهة مصمّمة لتكون مستقلة عن المحرّك، حتى يمكن استبدالها بـ SQLite لاحقاً. */
const DB = (() => {
  const NAME = 'albaraka';
  const VERSION = 1;
  const STORES = {
    contracts: { keyPath: 'id', indexes: [['no', 'no'], ['createdAt', 'createdAt']] },
    receipts: { keyPath: 'id', indexes: [['no', 'no'], ['createdAt', 'createdAt']] },
    customers: { keyPath: 'id', indexes: [['nameKey', 'nameKey']] },
    lists: { keyPath: 'id', indexes: [['type', 'type']] },
    settings: { keyPath: 'id', indexes: [] },
  };

  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const [name, def] of Object.entries(STORES)) {
          if (db.objectStoreNames.contains(name)) continue;
          const store = db.createObjectStore(name, { keyPath: def.keyPath });
          for (const [idx, path] of def.indexes) store.createIndex(idx, path);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function tx(store, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      let result;
      try { result = fn(s); } catch (e) { reject(e); return; }
      t.oncomplete = () => resolve(result && result.__req ? result.__req.result : result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  const wrap = (req) => ({ __req: req });

  const put = (store, value) => tx(store, 'readwrite', (s) => wrap(s.put(value)));
  const del = (store, key) => tx(store, 'readwrite', (s) => wrap(s.delete(key)));
  const get = (store, key) => tx(store, 'readonly', (s) => wrap(s.get(key)));
  const all = (store) => tx(store, 'readonly', (s) => wrap(s.getAll()));

  /* ----- الإعدادات ----- */
  const DEFAULT_SETTINGS = {
    id: 'main',
    shopName: 'معرض البركة لتجارة السيارات الحديثة',
    manager: 'كرم حسين علي',
    address: 'موصل - الساحل الأيسر - مدينة المعارض',
    phone: '',
    contractStart: 958,      // آخر رقم مستعمل في الدفتر الورقي
    contractLast: 958,
    receiptStart: 0,
    receiptLast: 0,
    currency: 'دينار عراقي',
    printerUrl: '',          // ipp://192.168.1.50:631/ipp/print
    printerMode: 'system',   // system | direct
    copiesContract: ['seller', 'buyer', 'shop'],
    copiesReceipt: ['buyer', 'shop'],
    easternDigits: false,
    images: { logo: '', headerRight: '', headerLeft: '' },
    terms: [
      'تم البيع بعد المعاينة والفحص التام للآلية من قبل المشتري، ولا يحق له الرجوع بأي عيب بعد التوقيع.',
      'يتحمل المشتري كافة المخالفات والتبعات القانونية المترتبة على الآلية اعتباراً من تاريخ هذا العقد.',
      'لا يتحمل المعرض أي مسؤولية بعد إتمام البيع وتوقيع الطرفين والشهود.',
    ],
  };

  async function settings() {
    const s = await get('settings', 'main');
    if (!s) { await put('settings', DEFAULT_SETTINGS); return { ...DEFAULT_SETTINGS }; }
    return { ...DEFAULT_SETTINGS, ...s, images: { ...DEFAULT_SETTINGS.images, ...(s.images || {}) } };
  }

  async function saveSettings(patch) {
    const current = await settings();
    const next = { ...current, ...patch, id: 'main' };
    await put('settings', next);
    return next;
  }

  /* ----- القوائم القابلة للتوسّع ----- */
  const LIST_TYPES = {
    machineType: 'نوع الآلية',
    brand: 'الماركة',
    color: 'اللون',
    province: 'المحافظة',
    idType: 'نوع الهوية',
    office: 'الدائرة',
    tool: 'الأداة',
  };

  const SEED = {
    machineType: ['ترتكتر', 'حاصدة'],
    brand: ['ماسي فيركسون', 'جون دير', 'نيوهولاند', 'كيس', 'كوبوتا', 'ديوتز'],
    color: ['أحمر', 'أزرق', 'أخضر', 'أصفر', 'أبيض', 'رمادي', 'برتقالي'],
    province: ['نينوى', 'أربيل', 'دهوك', 'كركوك', 'صلاح الدين', 'بغداد'],
    idType: ['بطاقة وطنية', 'هوية أحوال قديمة'],
    office: ['دائرة نينوى', 'دائرة الموصل الأولى', 'دائرة الموصل الثانية'],
    tool: ['سكة', 'دسك', 'ذراع شفل', 'دكاكة تبن', 'مقطورة', 'رشاشة', 'بذارة'],
  };

  async function seedIfEmpty() {
    const rows = await all('lists');
    if (rows.length) return;
    const now = Date.now();
    for (const [type, values] of Object.entries(SEED)) {
      for (const [i, value] of values.entries()) {
        await put('lists', {
          id: `${type}:${U.normalizeAr(value)}`,
          type, value, uses: 0, order: i, createdAt: now, seeded: true,
        });
      }
    }
  }

  /* عناصر قائمة مرتّبة: الأكثر استعمالاً أولاً */
  async function listItems(type) {
    const rows = (await all('lists')).filter((r) => r.type === type);
    rows.sort((a, b) => (b.uses - a.uses) || (a.order ?? 99) - (b.order ?? 99) || a.value.localeCompare(b.value, 'ar'));
    return rows;
  }

  async function addListItem(type, value) {
    const v = String(value || '').trim();
    if (!v) return null;
    const id = `${type}:${U.normalizeAr(v)}`;
    const existing = await get('lists', id);
    if (existing) return existing;
    const row = { id, type, value: v, uses: 0, order: 99, createdAt: Date.now() };
    await put('lists', row);
    return row;
  }

  async function bumpListItem(type, value) {
    const v = String(value || '').trim();
    if (!v) return;
    const id = `${type}:${U.normalizeAr(v)}`;
    const row = await get('lists', id);
    if (!row) return;                       // قيمة مؤقتة لم تُضَف للقائمة
    row.uses = (row.uses || 0) + 1;
    await put('lists', row);
  }

  const removeListItem = (id) => del('lists', id);

  /* ----- الزبائن ----- */
  async function saveCustomer(person) {
    const name = String(person?.name || '').trim();
    if (!name) return null;
    const nameKey = U.normalizeAr(name);
    const rows = await all('customers');
    const existing = rows.find((r) => r.nameKey === nameKey);
    const row = {
      ...(existing || { id: U.uid(), uses: 0 }),
      ...person,
      name, nameKey,
      uses: ((existing?.uses) || 0) + 1,
      updatedAt: Date.now(),
    };
    await put('customers', row);
    return row;
  }

  async function findCustomers(query, limit = 6) {
    const q = U.normalizeAr(query);
    if (q.length < 2) return [];
    const rows = await all('customers');
    return rows
      .map((r) => ({ row: r, score: r.nameKey.startsWith(q) ? 1 : U.similarity(r.nameKey, q) }))
      .filter((x) => x.score >= 0.55)
      .sort((a, b) => b.score - a.score || b.row.uses - a.row.uses)
      .slice(0, limit)
      .map((x) => x.row);
  }

  /* ----- العدادات ----- */
  async function nextNumber(kind) {
    const s = await settings();
    const key = kind === 'receipt' ? 'receiptLast' : 'contractLast';
    return (Number(s[key]) || 0) + 1;
  }

  async function commitNumber(kind, no) {
    const s = await settings();
    const key = kind === 'receipt' ? 'receiptLast' : 'contractLast';
    if (Number(no) > (Number(s[key]) || 0)) await saveSettings({ [key]: Number(no) });
  }

  /* ----- العقود والوصولات ----- */
  const saveContract = (c) => put('contracts', c);
  const saveReceipt = (r) => put('receipts', r);
  const getContract = (id) => get('contracts', id);
  const getReceipt = (id) => get('receipts', id);
  const allContracts = () => all('contracts');
  const allReceipts = () => all('receipts');
  const deleteContract = (id) => del('contracts', id);
  const deleteReceipt = (id) => del('receipts', id);

  async function exportAll() {
    return {
      exportedAt: new Date().toISOString(),
      version: VERSION,
      settings: await settings(),
      lists: await all('lists'),
      customers: await all('customers'),
      contracts: await allContracts(),
      receipts: await allReceipts(),
    };
  }

  async function importAll(data) {
    if (!data || typeof data !== 'object') throw new Error('ملف غير صالح');
    if (data.settings) await put('settings', { ...data.settings, id: 'main' });
    for (const key of ['lists', 'customers', 'contracts', 'receipts']) {
      for (const row of data[key] || []) await put(key, row);
    }
  }

  async function init() {
    await open();
    await settings();
    await seedIfEmpty();
  }

  return {
    init, settings, saveSettings, DEFAULT_SETTINGS, LIST_TYPES,
    listItems, addListItem, bumpListItem, removeListItem,
    saveCustomer, findCustomers,
    nextNumber, commitNumber,
    saveContract, saveReceipt, getContract, getReceipt,
    allContracts, allReceipts, deleteContract, deleteReceipt,
    exportAll, importAll,
  };
})();
