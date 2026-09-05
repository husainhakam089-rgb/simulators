// المقياس الحقيقي: صور تشبه صورة الموبايل — زاوية، اهتزاز، ونص صغير نسبةً للإطار.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { renderPhotos } from './make-photo.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5173';
const y = new Date().getFullYear() + 1;
const EXPECT_DATE = `${y}-09-18`;

const CATALOG = [
  { product_id:'p1', barcode:'1', name:'لبن ربيع كامل الدسم ١ لتر', category_name:'ألبان', default_shelf_life_days:14 },
  { product_id:'p2', barcode:'2', name:'معجون طماطم الكاسر ٨٠٠ غم', category_name:'معلبات', default_shelf_life_days:730 },
  { product_id:'p3', barcode:'3', name:'معجون طماطم الكاسر ٤٠٠ غم', category_name:'معلبات', default_shelf_life_days:730 },
  { product_id:'p4', barcode:'4', name:'شاي الغزالين ناعم ٤٥٠ غم', category_name:'شاي', default_shelf_life_days:730 },
];

// التاريخ مطبوع بطابعة صناعية نقطية وصغير الحجم، كما هو على البضاعة فعلاً.
// كثافة النقاط ٠٫٧ تقارب الطابعات الحقيقية: النقاط تتلامس فتكوّن حرفاً مصمتاً.
const LINES = ['معجون طماطم الكاسر', 'صافي الوزن 800 غم', `EXP 18/09/${y}`];
const D = 0.7;
const CASES = [
  { name:'قريب-واضح',  frameWidth:1280, boxWidth:0.78, titleScale:0.05, textScale:0.026,
    dateScale:0.024, dotMatrix:true, dotDensity:D, lines:LINES },
  { name:'مسافة-عادية', frameWidth:1280, boxWidth:0.55, titleScale:0.035, textScale:0.018,
    dateScale:0.016, dotMatrix:true, dotDensity:D, rotate:-3, skewX:0.05, blur:0.5, lines:LINES },
  { name:'بعيد-ومائل',  frameWidth:1280, boxWidth:0.42, titleScale:0.028, textScale:0.013,
    dateScale:0.012, dotMatrix:true, dotDensity:D, rotate:-6, skewX:0.09, skewY:0.03,
    blur:0.8, noise:24, lines:LINES, expectDate: null },   // بعيد جداً: حدّ معروف
];

const photos = await renderPhotos('tests/.build/photos', CASES);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

let dateOk = 0, nameOk = 0;
for (const p of photos) {
  const b64 = readFileSync(p.file).toString('base64');
  const r = await page.evaluate(async ({ b64, catalog }) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: 'image/jpeg' });
    const mod = await import('/src/lib/ocr.ts');
    const t0 = performance.now();
    const res = await mod.readPackage(blob, catalog, { shelfLifeDays: null });
    return {
      ms: Math.round(performance.now() - t0),
      expiry: res.date.expiry,
      dateConfidence: res.date.confidence,
      dateReason: res.date.reason,
      name: res.match.best?.item.name ?? null,
      confident: res.match.confident,
      text: res.text.replace(/\s+/g, ' ').trim().slice(0, 70),
    };
  }, { b64, catalog: CATALOG });

  const want = p.expectDate === null ? null : EXPECT_DATE;
  const d = r.expiry === want;
  const n = p.expectName === null ? r.name === null : r.name === 'معجون طماطم الكاسر ٨٠٠ غم';
  if (d) dateOk++;
  if (n) nameOk++;
  console.log(`${d && n ? '✓' : '✗'} ${p.name}`);
  console.log(`    التاريخ: ${r.expiry ?? '—'} [${r.dateConfidence}]${d ? (want === null ? '  (حدّ معروف: لا يخترع تاريخاً)' : '') : `  (المتوقع ${want ?? 'لا شيء'})`}`);
  console.log(`    الاسم:   ${r.name ?? '—'}${n ? (r.confident ? ' [حاسم]' : ' [اقتراح]') : ''}`);
  console.log(`    قرأ: "${r.text}"   [${r.ms}ms]`);
}
console.log(`\nالتواريخ ${dateOk}/${photos.length}   الأسماء ${nameOk}/${photos.length}`);
await browser.close();
process.exit(dateOk === photos.length && nameOk === photos.length ? 0 : 1);
