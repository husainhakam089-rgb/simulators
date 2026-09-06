// قياس مسار المحركين داخل الجهاز على صور تحاكي الكارتون الحقيقي.
//
// المقياس هنا ليس «كم تاريخاً وجد» بل «كم تاريخاً عرضه وكان صحيحاً»، وقبله
// «كم تاريخاً عرضه وكان خاطئاً» — وهذا الأخير يجب أن يبقى صفراً. تاريخ خاطئ
// يعني بضاعة سليمة تُتلف أو خربانة تُباع، وهو أسوأ من لا تاريخ.
// يفشل الاختبار إن عُرض تاريخ خاطئ واحد.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { renderPhotos } from './make-photo.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5178';
const y = new Date().getFullYear() + 1;
const EXPECT = `${y}-09-18`;
const LINES = ['معجون طماطم الكاسر', 'صافي الوزن 800 غم', `EXP 18/09/${y}`];
const D = 0.7;
// ملاحظة على حدود هذا المقياس: جرّبنا رسم نفس الكراتين بعرض ٢٥٦٠ بدل ١٢٨٠،
// فانقلبت النتائج — سقط ما كان يُقرأ، واتفق المحركان مرة على تاريخ خاطئ. أي
// أن هندسة النقاط في رسمنا لا تتصرّف كما تتصرّف الطابعة الحقيقية عند التكبير.
// فهذا المقياس يثبت أن البرنامج لا يعرض تاريخاً خاطئاً، ولا يثبت كم يقرأ على
// بضاعة حقيقية — ذلك يُقاس من `reading_accuracy` بعد الاستعمال.
const CASES = [
  { name:'قريب-واضح',  frameWidth:1280, boxWidth:0.78, titleScale:0.05, textScale:0.026,
    dateScale:0.024, dotMatrix:true, dotDensity:D, lines:LINES },
  { name:'مسافة-عادية', frameWidth:1280, boxWidth:0.55, titleScale:0.035, textScale:0.018,
    dateScale:0.016, dotMatrix:true, dotDensity:D, rotate:-3, skewX:0.05, blur:0.5, lines:LINES },
  { name:'بعيد-ومائل',  frameWidth:1280, boxWidth:0.42, titleScale:0.028, textScale:0.013,
    dateScale:0.012, dotMatrix:true, dotDensity:D, rotate:-6, skewX:0.09, skewY:0.03,
    blur:0.8, noise:24, lines:LINES },
  { name:'نقاط-متفرقة', frameWidth:1280, boxWidth:0.6, titleScale:0.035, textScale:0.018,
    dateScale:0.018, dotMatrix:true, dotDensity:0.45, rotate:-2, blur:0.4, lines:LINES },
];

const photos = await renderPhotos('tests/.build/photos-probe', CASES);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.error('  [err]', m.text().slice(0, 200)); });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

let ok = 0, wrong = 0, none = 0;
for (const p of photos) {
  const b64 = readFileSync(p.file).toString('base64');
  const r = await page.evaluate(async ({ b64, rect }) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: 'image/jpeg' });
    const mod = await import('/src/lib/ocr.ts');
    const ops = await import('/src/lib/imageOps.ts');

    // قصّة إطار التوجيه: العامل يوجّه المربّع على التاريخ، فنقتطع حوله كما
    // يقتطع التطبيق — هامش سخيّ لأن يده ليست ثابتة على السطر بالضبط
    let roi = null;
    if (rect) {
      const bmp2 = await createImageBitmap(blob);
      const full = document.createElement('canvas');
      full.width = bmp2.width; full.height = bmp2.height;
      full.getContext('2d').drawImage(bmp2, 0, 0);
      const pad = 0.10;
      const c = ops.crop(full, {
        x: Math.max(0, rect.x / bmp2.width - pad),
        y: Math.max(0, rect.y / bmp2.height - pad * 2),
        w: Math.min(1, rect.w / bmp2.width + pad * 2),
        h: Math.min(1, rect.h / bmp2.height + pad * 4),
      });
      roi = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    }

    const t0 = performance.now();
    const res = await mod.readDateSmart(blob, roi, { shelfLifeDays: null, today: new Date() });
    return { ms: Math.round(performance.now() - t0), expiry: res.expiry, conf: res.confidence, reason: res.reason, via: res.via };
  }, { b64, rect: p.dateRect ?? null });

  const shown = r.conf === 'high' ? r.expiry : null;   // ما لا يُعرض لا يُحسب
  const good = shown === EXPECT;
  if (shown === null) none++; else if (good) ok++; else wrong++;
  console.log(`${shown === null ? '·' : good ? '✓' : '✗'} ${p.name}: ${r.expiry ?? '—'} [${r.conf}] ${r.via} (${r.ms} م.ث)`);
  console.log(`    ${r.reason}`);
}
console.log(`\nمعروض وصحيح ${ok}/${photos.length} — معروض وخاطئ ${wrong} — لم يُعرض ${none}`);

await browser.close();
process.exit(wrong > 0 ? 1 : 0);
