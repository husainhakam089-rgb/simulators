// اختبار مسار القراءة السحابية: هل يُقدَّم على محرك الجهاز، وهل يسقط عليه
// بأمان حين لا يكون المفتاح مضبوطاً، وهل يتوقف عن نداء الخدمة بعدها.
//
// الخدمة نفسها لا تُنادى هنا: نعترض النداء ونرجّع نصاً كما ترجعه — هكذا يقيس
// الاختبار منطقنا لا شبكة أحد، ويعمل بلا مفتاح وبلا كلفة.
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? process.argv[2] ?? 'http://127.0.0.1:5173';
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.error('  [console]', m.text()); });

// عدّاد نداءات الخدمة + النص الذي ترجّعه
let calls = 0;
let reply = { ok: true, text: '' };
await page.route('**/functions/v1/read-label', async (route) => {
  calls++;
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(reply),
  });
});

await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });

// صورة بلا أي نص مقروء: محرك الجهاز لا يجد فيها شيئاً، فأي تاريخ يظهر
// لا يمكن أن يأتي إلا من السحابة
const blankImage = async () => {
  await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 600; c.height = 400;
    const g = c.getContext('2d');
    g.fillStyle = '#b9a07a'; g.fillRect(0, 0, c.width, c.height);
    window.__img = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.8));
  });
};

// ------------------------------------------------ ١) التاريخ يأتي من السحابة
await blankImage();
reply = { ok: true, text: 'LOT 4471\nEXP 18/09/2027\n' };
calls = 0;
let r = await page.evaluate(async () => {
  const mod = await import('/src/lib/ocr.ts');
  const cloud = await import('/src/lib/cloudOcr.ts');
  cloud.resetCloudAvailability();
  const res = await mod.readDateSmart(window.__img, null, { today: new Date() });
  return { expiry: res.expiry, via: res.via, confidence: res.confidence, reason: res.reason };
});
ok('يقرأ التاريخ من الخدمة السحابية', r.expiry === '2027-09-18' && r.via === 'cloud', `${r.expiry} / ${r.via}`);
ok('يبقى التاريخ السحابي واثقاً', r.confidence === 'high', r.confidence);
ok('يوضّح المصدر في السبب', /سحابية/.test(r.reason ?? ''), r.reason);
ok('نداء واحد لصورة واحدة', calls === 1, `${calls}`);

// ------------------------------- ٢) لا يعتمد تاريخاً غير واثق ولو جاء سحابياً
reply = { ok: true, text: 'EXP 18/8/2027\n' };   // خانة ناقصة بجوار خانتين
r = await page.evaluate(async () => {
  const mod = await import('/src/lib/ocr.ts');
  const res = await mod.readDateSmart(window.__img, null, { today: new Date() });
  return { expiry: res.expiry, confidence: res.confidence };
});
ok('التاريخ المشكوك فيه يبقى «غير واثق»', r.confidence === 'low', `${r.expiry} / ${r.confidence}`);

// ------------------------------------ ٣) اسم المنتج يُطابق من النص السحابي
reply = { ok: true, text: 'معجون طماطم الرافدين ٨٠٠ غم\nEXP 05/2027\n' };
r = await page.evaluate(async () => {
  const mod = await import('/src/lib/ocr.ts');
  const items = [
    { product_id: 'p1', name: 'معجون طماطم الرافدين ٨٠٠غم', default_shelf_life_days: 540 },
    { product_id: 'p2', name: 'زيت دوار الشمس زير ١ لتر', default_shelf_life_days: 365 },
  ];
  const res = await mod.readLabelSmart(window.__img, null, items, {});
  return { name: res.match.best?.item?.name ?? null, confident: res.match.confident, via: res.via, expiry: res.date.expiry };
});
ok('يطابق اسم المنتج من النص السحابي', r.confident && r.name?.includes('الرافدين'), `${r.name}`);
ok('يقرأ تاريخ الشهر/السنة معه', r.expiry === '2027-05-31', `${r.expiry}`);

// -------------------------- ٤) مفتاح غير مضبوط: يسقط على الجهاز ولا يعاود النداء
reply = { ok: false, reason: 'not_configured' };
await page.evaluate(async () => {
  const cloud = await import('/src/lib/cloudOcr.ts');
  cloud.resetCloudAvailability();
});
calls = 0;
r = await page.evaluate(async () => {
  const mod = await import('/src/lib/ocr.ts');
  const first = await mod.readDateSmart(window.__img, null, { today: new Date() });
  const second = await mod.readDateSmart(window.__img, null, { today: new Date() });
  return { first: first.via, second: second.via, expiry: first.expiry };
});
ok('يسقط على محرك الجهاز بلا مفتاح', r.first === 'device' || r.first === 'none', r.first);
ok('لا يعاود نداء الخدمة بعد «غير مضبوط»', calls === 1, `${calls} نداء`);

// -------------------------------------- ٥) حجم الإرسال: لا نرفع صورة عملاقة
r = await page.evaluate(async () => {
  const cloud = await import('/src/lib/cloudOcr.ts');
  const c = document.createElement('canvas');
  c.width = 2560; c.height = 1440;
  const g = c.getContext('2d');
  g.fillStyle = '#888'; g.fillRect(0, 0, c.width, c.height);
  const big = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.95));
  const data = await cloud.blobToJpegBase64(big);
  const img = new Image();
  img.src = data;
  await img.decode();
  return { width: img.width, kb: Math.round((data.length * 3) / 4 / 1024) };
});
ok('يصغّر الصورة قبل الرفع', r.width === 1600, `${r.width}px ≈ ${r.kb}KB`);

await browser.close();
const failed = results.filter((x) => !x.pass).length;
console.log(`\nنجح ${results.length - failed} من ${results.length} — فشل ${failed}`);
process.exit(failed ? 1 : 0);
