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

// ------------------------------ ٤) وكيل القراءة: حقول مفصولة جاهزة
//
// حين يفصل الوكيل الحقول بنفسه لا نعيد تحليل نصّه بقواعدنا — هو رأى الصورة.
// لكن تعهّده بالوضوح (sure) وسقف عمر المجموعة يبقيان حاكمين فوقه.
const agentReply = (fields) => ({
  ok: true, text: fields.verbatim_text ?? '', fields: { sure: true, note: null, ...fields },
});

reply = agentReply({
  verbatim_text: 'معجون طماطم الرافدين\nEXP 18/09/2027',
  product_name: 'معجون طماطم الرافدين ٨٠٠غم',
  expiry_raw: '18/09/2027', expiry_date: '2027-09-18', production_date: '2025-09-18', sure: true,
});
r = await page.evaluate(async () => {
  const mod = await import('/src/lib/ocr.ts');
  const res = await mod.readDateSmart(window.__img, null, { today: new Date(), shelfLifeDays: 730 });
  return { expiry: res.expiry, production: res.production, conf: res.confidence, reason: res.reason };
});
ok('يعتمد تاريخ الوكيل كما هو', r.expiry === '2027-09-18' && r.conf === 'high', `${r.expiry} / ${r.conf}`);
ok('ويأخذ معه تاريخ الإنتاج', r.production === '2025-09-18', `${r.production}`);
ok('ويوضّح أن الوكيل هو من قرأه', /وكيل القراءة/.test(r.reason ?? ''), r.reason);

reply = agentReply({
  verbatim_text: 'EXP 1?/09/2027', product_name: null,
  expiry_raw: '1?/09/2027', expiry_date: '2027-09-18', production_date: null,
  sure: false, note: 'خانة اليوم غير واضحة',
});
r = await page.evaluate(async () => {
  const mod = await import('/src/lib/ocr.ts');
  const res = await mod.readDateSmart(window.__img, null, { today: new Date(), shelfLifeDays: 730 });
  return { expiry: res.expiry, conf: res.confidence, reason: res.reason };
});
ok('وإن لم يتأكد الوكيل يبقى التاريخ غير موثوق', r.conf === 'low', `${r.expiry} / ${r.conf}`);

reply = agentReply({
  verbatim_text: 'EXP 18/09/2029', product_name: null,
  expiry_raw: '18/09/2029', expiry_date: '2029-09-18', production_date: null, sure: true,
});
r = await page.evaluate(async () => {
  const mod = await import('/src/lib/ocr.ts');
  const res = await mod.readDateSmart(window.__img, null, { today: new Date(), shelfLifeDays: 14 });
  return { expiry: res.expiry, conf: res.confidence, reason: res.reason };
});
ok('سقف عمر المجموعة يحكم على الوكيل أيضاً', r.conf === 'low' && /أبعد من عمر/.test(r.reason ?? ''),
   `${r.conf} — ${r.reason}`);

reply = agentReply({
  verbatim_text: 'معجون طماطم الرافدين ٨٠٠ غم\nEXP 18/09/2027',
  product_name: 'معجون طماطم الرافدين ٨٠٠غم',
  expiry_raw: '18/09/2027', expiry_date: '2027-09-18', production_date: null, sure: true,
});
r = await page.evaluate(async () => {
  const mod = await import('/src/lib/ocr.ts');
  const items = [
    { product_id: 'p1', name: 'معجون طماطم الرافدين ٨٠٠غم', default_shelf_life_days: 730 },
    { product_id: 'p2', name: 'زيت دوار الشمس زير ١ لتر', default_shelf_life_days: 365 },
  ];
  const res = await mod.readLabelSmart(window.__img, null, items, { shelfLifeDays: 730 });
  return { name: res.match.best?.item?.name ?? null, confident: res.match.confident,
           expiry: res.date.expiry, conf: res.date.confidence };
});
ok('يطابق الصنف من اسم الوكيل لا من النص الخام', r.confident && r.name?.includes('الرافدين'), `${r.name}`);
ok('ويأخذ تاريخ الوكيل في نفس القراءة', r.expiry === '2027-09-18' && r.conf === 'high', `${r.expiry}/${r.conf}`);

// -------------------------- ٥) مفتاح غير مضبوط: يسقط على الجهاز ولا يعاود النداء
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

// -------------------------------------- ٦) حجم الإرسال: لا نرفع صورة عملاقة
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
